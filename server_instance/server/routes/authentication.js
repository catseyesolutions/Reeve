import { register } from "~/shared/validation/authentication";
import { t } from "~/shared/translations/i18n";
import { perform } from "../database.js";
import validate from "validate.JS";

// Register New Client Account
module.exports = function(router) {
	// Remove spaces and special characters from workspace url
	// Check Workspace URL is not a critical name
	// Validate workspace url does not exist
	// Validate client object
	// Attempt to create client account
	// Attempt to create new owner level user
	// Report to Sentry
	// Report to Papertrail
	// Return securityKey
	router.post("/internal/register", function(req, res) {
		// Validate properties in received object
		const valid = validate(req.body, register);
		if (valid != null) {
			res.status(403).send({ message: t("validation.clientInvalidProperties"), errors: valid });
		}
		// Connect to Database to perform existing Workspace URL Lookup
		perform().getConnection(function(err, connection) {
			if (err) throw err;
			// Check Workspace URL is unique in database
			connection.query("SELECT WORKSPACE_URL FROM `client` WHERE `WORKSPACE_URL` = ?", [req.body.workspaceURL], function(error, results, fields) {
				if (error) throw error;
				// Release connection
				connection.release();
			});
		});
	});
};
