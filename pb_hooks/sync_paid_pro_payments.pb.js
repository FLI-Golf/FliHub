/// <reference path="../pb_data/types.d.ts" />

cronAdd("sync_paid_pro_payments", "* * * * *", () => {
	const pending = $app.findRecordsByFilter(
		"pro_payments",
		"transactionId != '' && status != 'paid'",
		"-updated",
		500,
		0
	);

	for (const payment of pending) {
		payment.set("status", "paid");
		$app.save(payment);
	}
});