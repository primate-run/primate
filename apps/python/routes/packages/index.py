from primate import Route
import numpy as np


@Route.get
def test_numpy(request):
    try:
        # Simple numpy operations to test the package
        arr = np.array([1, 2, 3, 4, 5])
        result = {
            "status": "success",
            "array": arr.tolist(),
            "sum": int(np.sum(arr)),
            "mean": float(np.mean(arr)),
            "numpy_version": np.__version__,
        }
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}
