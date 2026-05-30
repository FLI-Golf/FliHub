/// <reference path="../pb_data/types.d.ts" />

// Runs every minute. Finds bids that have been in 'awarded' status for more than
// 5 minutes and moves them to 'closed'.
cronAdd("auto_close_awarded_bids", "* * * * *", () => {
	const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);

	const bids = $app.findRecordsByFilter(
		"bids",
		"status = 'awarded' && awardedAt != '' && awardedAt <= {:cutoff}",
		"-awardedAt",
		500,
		0,
		{ cutoff: cutoff }
	);

	for (const bid of bids) {
		bid.set("status", "closed");
		$app.save(bid);
	}
});
