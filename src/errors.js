module.exports = {
  MISSING_EMUSEUM_KEY: new Error('Missing EMUSEUM_KEY, please export it'),
  CSV_READ_ERROR: new Error(
    'Error reading csv, make sure you have cloned the data submodule'
  ),
  CSV_WRITE_ERROR: new Error('Could not write to csv! Check your permissions?'),
  XML_READ_ERROR: new Error(
    'Error reading xml, make sure it exists and you have permissions?'
  ),
  XML_PARSE_ERROR: new Error(
    'Error parsing xml, make sure it is utf8?'
  )
}
