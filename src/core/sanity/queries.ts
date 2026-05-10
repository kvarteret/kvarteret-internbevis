const ARRANGEMENT_PROJECTION = `{
  _id,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  isRecurring,
  rrule,
  "dates": dates | order(startDate asc) {
    _key,
    "startDate": coalesce(startDate, ""),
    startTime,
    endTime
  },
  isFree,
  priceOrdinar,
  priceStudent,
  priceMedlem,
  ticketUrl,
  facebookUrl,
  "imageUrl": image.asset->url,
  imageCaption,
  "room": room-> { _id, "name": coalesce(title, ""), "slug": coalesce(slug.current, "") },
  roomText,
  "organizerGroup": organizerGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") },
  organizerText,
  "eventType": eventType-> {
    _id,
    "name": coalesce(name, ""),
    "slug": coalesce(slug.current, ""),
    "taxonomyGroup": taxonomyGroup-> { _id, "name": coalesce(name, ""), "slug": coalesce(slug.current, "") }
  },
  description
}`

export const PUBLISHED_ARRANGEMENTS_QUERY = `
*[_type == "arrangement" && approvalStatus == "approved" && (
    count(dates[startDate >= $today]) > 0
    || (isRecurring == true && defined(rrule) && count(dates) > 0)
)]
| order(
    coalesce(dates[startDate >= $today][0].startDate, dates[0].startDate) asc,
    coalesce(dates[startDate >= $today][0].startTime, dates[0].startTime, "00:00") asc
)
${ARRANGEMENT_PROJECTION}
`

export const ARRANGEMENT_BY_ID_QUERY = `
*[_type == "arrangement" && _id == $id && approvalStatus == "approved"][0]
${ARRANGEMENT_PROJECTION}
`
