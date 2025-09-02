def get(request)
  Primate.session.create({ :foo => "bar"})

  Primate.session.get()
end
