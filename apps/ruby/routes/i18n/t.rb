require 'primate/route'
require 'primate/i18n'

Route.get do |request|
	I18N.t("welcome", {name: "John", count: 5})
end
