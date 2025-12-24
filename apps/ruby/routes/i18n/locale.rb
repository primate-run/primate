require 'primate/route'
require 'primate/i18n'

Route.get do |request|
	I18N.locale.get
end
