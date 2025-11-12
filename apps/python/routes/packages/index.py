from primate import Route
# import numpy as np


@Route.get
def test_numpy(request):
    return "test"
