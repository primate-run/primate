require 'primate/route'
require 'primate/i18n'

Route.get do |request|
  I18N.t("foo.bar", {s: 4})
end
