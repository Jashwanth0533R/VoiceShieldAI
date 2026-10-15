def get_context(request):

    transaction_requested = request.form.get(
        "transaction_requested",
        "false"
    )

    sensitive_information_requested = request.form.get(
        "sensitive_information_requested",
        "false"
    )

    return {
        "caller_id": request.form.get(
            "caller_id"
        ),

        "caller_type": request.form.get(
            "caller_type"
        ),

        "claimed_identity": request.form.get(
            "claimed_identity"
        ),

        "transaction_requested":
            parse_bool(transaction_requested),

        "transaction_amount":
            parse_amount(
                request.form.get(
                    "transaction_amount"
                )
            ),

        "urgency": request.form.get(
            "urgency"
        ),

        "sensitive_information_requested":
            parse_bool(
                sensitive_information_requested
            )
    }


def parse_bool(value):

    if isinstance(value, bool):
        return value

    return str(value).lower() in [
        "true",
        "1",
        "yes"
    ]


def parse_amount(value):

    if value is None or value == "":
        return 0

    try:
        amount = float(value)

    except ValueError:

        raise ValueError(
            "transaction_amount must be numeric"
        )

    if amount < 0:

        raise ValueError(
            "transaction_amount cannot be negative"
        )

    return amount