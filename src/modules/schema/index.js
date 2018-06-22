exports.schema = `
type Query {
  hello: String
  objects(
    page: Int
    per_page: Int
    sort: String = "asc"
    sort_field: String = "id"
    object_name: String
    maker: String
    period: String
    medium: String
    title: String
    keyword: String
    color: String
    color_threshold: Float = 50.0
    color_source: String = "google"
  ): [Object]
  object(id: Int!): SingleObject
  objectNames(page: Int, per_page: Int, sort: String = "asc", sort_field: String = "id"): [ObjectName]
  makers(page: Int, per_page: Int, sort: String = "asc", sort_field: String = "id"): [Maker]
  periods(page: Int, per_page: Int, sort: String = "asc", sort_field: String = "id"): [Period]
  mediums(page: Int, per_page: Int, sort: String = "asc", sort_field: String = "id"): [Medium]
  exhibitions(page: Int, per_page: Int, sort: String = "asc", sort_field: String = "id"): [Exhibition]
  exhibition(
    id: Int!
    page: Int
    per_page: Int
    sort: String = "asc"
    sort_field: String = "id"
    object_name: String
    maker: String
    period: String
    medium: String
    title: String
    color: String
    color_threshold: Float = 50.0
    color_source: String = "google"
  ): SingleExhibition
  events(
    page: Int
    per_page: Int
    sort: String = "asc"
    sort_field: String = "eventId"
    eventName: String
    subject: String
    courseNbr: String
    description: String
    facultyMember: String
    eventType: String
  ): [Event]
  event(
    id: Int!
    page: Int
    per_page: Int
    sort: String = "asc"
    sort_field: String = "id"
    object_name: String
    maker: String
    period: String
    medium: String
    title: String
    color: String
    color_threshold: Float = 50.0
    color_source: String = "google"
  ): SingleEvent
}

type Sort {
  field: String
  direction: String
}

type Object {
  id: Int
  accession_number: String
  title: String
  maker: String
  ulan: String
  department: String
  classification: String
  culture: String
  period: String
  creation_date: String
  creation_date_earliest: String
  creation_date_latest: String
  accession_date: String
  source_name: String
  object_name: String
  medium: String
  description: String
  credit_line: String
  paper_support: String
  catalogue_raisonne: String
  portfolio: String
  signed: String
  marks: String
  inscriptions: String
  filename: String
  dimensions: String
  element_type: String
  width_cm: String
  height_cm: String
  depth_cm: String
  width_in: String
  height_in: String
  depth_in: String
  area_in: String
  size_s_m_l: String
  is_3d: String
  orientation_p_l_s: String
  copyright_holder: String
  remote: Remote
  color: ColorInfo
}

type SingleObject {
  id: Int
  accession_number: String
  title: String
  maker: String
  ulan: String
  department: String
  classification: String
  culture: String
  period: String
  creation_date: String
  creation_date_earliest: String
  creation_date_latest: String
  accession_date: String
  source_name: String
  object_name: String
  medium: String
  description: String
  credit_line: String
  paper_support: String
  catalogue_raisonne: String
  portfolio: String
  signed: String
  marks: String
  inscriptions: String
  filename: String
  dimensions: String
  element_type: String
  width_cm: String
  height_cm: String
  depth_cm: String
  width_in: String
  height_in: String
  depth_in: String
  area_in: String
  size_s_m_l: String
  is_3d: String
  orientation_p_l_s: String
  copyright_holder: String
  remote: Remote
  color: ColorInfo
  exhibitions: [Exhibition]
  events: [Event]
}

type Remote {
  status: String
  original_image_id: String
  public_id: String
  version: Int
  signature: String
  width: Int
  height: Int
  format: String
}

type ColorInfo {
  predominant: [ColorValue]
  search: Search
}

type Search {
  google: [ColorValue]
  cloudinary: [ColorValue]
}

type ColorValue {
  color: String
  value: Float
}

type ObjectName {
  id: Int
  title: String
  count: Int
  images: [Remote]
  keyImage: Remote
}

type Maker {
  id: Int
  title: String
  count: Int
  images: [Remote]
  keyImage: Remote
}

type Period {
  id: Int
  title: String
  count: Int
  images: [Remote]
  keyImage: Remote
}

type Medium {
  id: Int
  title: String
  count: Int
  images: [Remote]
  keyImage: Remote
}

type Exhibition {
  id: Int
  title: String
  planningNotes: String
  beginISODate: String
  beginDate: Int
  isInHouse: Boolean
  objects: [Int]
  curNotes: String
  endISODate: String
  endDate: Int
  keyImage: Remote
}

type SingleExhibition {
  id: Int
  title: String
  planningNotes: String
  beginISODate: String
  beginDate: Int
  isInHouse: Boolean
  objects: [Object]
  curNotes: String
  endISODate: String
  endDate: Int
  keyImage: Remote
}

type Event {
  eventId: Int
  eventName: String
  facultyMember: String
  subjectAndCourse: String
  subject: String
  courseNbr: Int
  institution: String
  description: String
  startDate: String
  startYear: Int
  startMonth: Int
  startDay: Int
  dayOfTheWeek: String
  eventType: String
  objects: [Int]
  keyImage: Remote
}

type SingleEvent {
  eventId: Int
  eventName: String
  facultyMember: String
  subjectAndCourse: String
  subject: String
  courseNbr: Int
  institution: String
  description: String
  startDate: String
  startYear: Int
  startMonth: Int
  startDay: Int
  dayOfTheWeek: String
  eventType: String
  objects: [Object]
  keyImage: Remote
}

`
