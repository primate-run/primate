require "json"

def wrap(value, helpers)
  resolved = helpers.call("wrap", value).to_s

  if resolved == "integer"
    return value.to_i
  end

  if resolved == "float"
    return value.to_f
  end

  if resolved == "boolean"
    return value == JS::True
  end

  if resolved == "string"
    return value.to_s
  end

  if resolved == "nil"
    return nil
  end

  if resolved == "array"
    as_array = JS.global[:Array].from(value)
    return Array.new(as_array[:length].to_i) {
      # recurse
      wrap(as_array[_1], helpers)
    }
  end

  if resolved == "object"
    as_entries = JS.global[:Object].entries(value)
    return Hash[Array.new(as_entries[:length].to_i) {[
      as_entries[_1][0].to_s,
      # recurse
      wrap(as_entries[_1][1], helpers)
    ]}]
  end

  value
end

class Session
  def initialize(session, helpers)
    @session = session
    @helpers = helpers
  end

  def id
    @session["id"]
  end

  def exists
    @session["exists"]
  end

  def create(data)
    @session.call("create", data)
  end

  def get()
    @session.call("get")
  end

  def try()
    @session.call("try")
  end

  def set(data)
    @session.call("set", data)
  end

  def destroy(foo)
    @session.call("destroy", foo)
  end
end

class Primate
  def self.view(name, props = {}, options = {})
    {:__PRMT__ => "view", :name => name, :props => props, :options => options}
  end

  def self.redirect(location, options = {})
    {:__PRMT__ => "redirect", :location => location, :options => options}
  end

  def self.error(options = {})
    {:__PRMT__ => "error", :options => options}
  end

  def self.set_session(session, helpers)
    @session = Session.new(session, helpers)
  end

  def self.session
    @session
  end
end

class URL
  def initialize(url)
    @href = url["href"].to_s
    @origin = url["origin"].to_s
    @protocol = url["protocol"].to_s
    @username = url["username"].to_s
    @password = url["password"].to_s
    @host = url["host"].to_s
    @hostname = url["hostname"].to_s
    @port = url["port"].to_s
    @pathname = url["pathname"].to_s
    @search = url["search"].to_s
    @hash = url["hash"].to_s
  end

  def href
    @href
  end

  def origin
    @origin
  end

  def protocol
    @protocol
  end

  def username
    @username
  end

  def password
    @password
  end

  def host
    @host
  end

  def hostname
    @hostname
  end

  def port
    @port
  end

  def pathname
    @pathname
  end

  def search
    @search
  end

  def hash
    @hash
  end
end

%%CLASSES%%

class Request
  def initialize(request, helpers)
    @url = URL.new(request["url"])
    @body = wrap(request["body"], helpers)
    @path = request["path"]
    @query = request["query"]
    @headers = request["headers"]
    @cookies = request["cookies"]
    %%REQUEST_INITIALIZE%%
  end

  def url
    @url
  end

  def body
    @body
  end

  def path
    @path
  end

  def query
    @query
  end

  def headers
    @headers
  end

  def cookies
    @cookies
  end

  %%REQUEST_DEFS%%
end
