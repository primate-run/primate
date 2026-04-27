from primate import Route, I18N


@Route.get
def get(request):
    return I18N.t("foo.bar", {"s": 4})
