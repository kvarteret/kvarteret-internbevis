const CONCRETE_EVENT_KINDS = `coalesce(eventKind, "single") in ["single", "seriesInstance", "festivalSession"]`

// These fields inherit from series/festival parents. Keep the projection and
// the domain resolver aligned with samfunnetibergen's canonical event query.
// The native app renders text blocks only, so embedded Portable Text images
// are intentionally excluded at the query boundary.
const INHERITABLE_EVENT_FIELDS_PROJECTION = `
  title,
  "description": description[_type == "block"],
  "imageUrl": image.asset->url,
  imageCaption,
  "organizerGroup": organizerGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") },
  organizerText,
  "eventType": eventType-> {
    _id,
    "name": coalesce(name, ""),
    "slug": coalesce(slug.current, ""),
    "taxonomyGroup": taxonomyGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") }
  },
  isFree,
  priceOrdinar,
  priceStudent,
  priceMedlem,
  ticketUrl,
  facebookUrl,
  isInternalEvent`

const ARRANGEMENT_PROJECTION = `{
  _id,
  "eventKind": coalesce(eventKind, "single"),
  eventStatus,
  "parent": parentEvent-> {
    _id,
    "slug": coalesce(slug.current, ""),
    "eventKind": coalesce(eventKind, "single"),
    eventStatus,
    ${INHERITABLE_EVENT_FIELDS_PROJECTION}
  },
  "slug": coalesce(slug.current, ""),
  "isRecurring": coalesce(isRecurring, false),
  rrule,
  "dates": coalesce(dates[] | order(startDate asc) {
    _key,
    "startDate": coalesce(startDate, ""),
    startTime,
    endTime
  }, []),
  "room": room-> { _id, "name": coalesce(title, ""), "slug": coalesce(slug.current, "") },
  roomText,
  ${INHERITABLE_EVENT_FIELDS_PROJECTION}
}`

export const PUBLISHED_ARRANGEMENTS_QUERY = `
*[_type == "arrangement" && approvalStatus == "approved"
    && ${CONCRETE_EVENT_KINDS}
    && (coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true || $includeInternal == true)
    && count(dates[startDate >= $today]) > 0]
| order(
    coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc,
    coalesce(dates[startDate >= $today][0].startTime, dates[0].startTime, "00:00") asc
)
${ARRANGEMENT_PROJECTION}
`

export const ARRANGEMENT_BY_ID_QUERY = `
*[_type == "arrangement" && _id == $id && approvalStatus == "approved"
    && ${CONCRETE_EVENT_KINDS}
    && (coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true || $includeInternal == true)][0]
${ARRANGEMENT_PROJECTION}
`
