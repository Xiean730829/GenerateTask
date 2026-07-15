class WorkerError(Exception):
    def __init__(self, code: str, message: str, *, retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


class QualityCheckFailed(WorkerError):
    def __init__(self, message: str = "script quality check failed") -> None:
        super().__init__("SCRIPT_QUALITY_CHECK_FAILED", message, retryable=False)
