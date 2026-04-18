require 'primate/route'

Route.post(content_type: "multipart/form-data") do |request|
  multipart = request.body.multipart

  baz = begin
    Integer(multipart.form["baz"].to_s, 10)
  rescue ArgumentError, TypeError
    0
  end
  foo = multipart.form["foo"].to_s
  greeting = multipart.files.find { |f| f.field == "greeting" }
  {
    "baz" => baz,
    "foo" => foo,
    "greeting" => {
      "name"    => greeting&.filename,
      "size"    => greeting&.size,
      "type"    => greeting&.content_type,
      "content" => greeting&.io&.read&.force_encoding("UTF-8"),
    },
  }
end
