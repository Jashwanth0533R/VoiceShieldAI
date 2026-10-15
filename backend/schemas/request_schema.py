from pydantic import BaseModel
from typing import Optional


class AnalysisRequest(BaseModel):

    caller_id: Optional[str] = None

    caller_type: Optional[str] = None

    claimed_identity: Optional[str] = None

    transaction_requested: bool = False

    transaction_amount: float = 0

    urgency: Optional[str] = None

    sensitive_information_requested: bool = False