exports.schema = `
type Query {
  hello: String
  objects(
    page: Int,
    per_page: Int,
    object_name: String,
    maker: String,
    period: String,
    medium: String,
    title: String
  ): [Object]
  object(id: Int!): Object
  objectNames(page: Int, per_page: Int): [ObjectName]
  makers(page: Int, per_page: Int): [Maker]
  periods(page: Int, per_page: Int): [Period]
  mediums(page: Int, per_page: Int): [Medium]
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

type ObjectName {
  id: Int
  title: String
  count: Int
}

type Maker {
  id: Int
  title: String
  count: Int
}

type Period {
  id: Int
  title: String
  count: Int
}

type Medium {
  id: Int
  title: String
  count: Int
}

`
