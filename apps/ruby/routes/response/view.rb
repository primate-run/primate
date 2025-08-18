def get(request)
  Primate.view("index.html", { :hello => "world" })
end
