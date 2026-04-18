require 'primate/route'

Route.post(content_type: "application/x-www-form-urlencoded") do |request|
  request.body.form
end
