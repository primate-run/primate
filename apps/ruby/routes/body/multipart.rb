require 'primate/route'

Route.post(content_type: "multipart/form-data") do |request|
  request.body.multipart.form
end
