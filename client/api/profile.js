import fetch from "common/fetch";

// Load User Personal Profile Details
export function loadPersonalProfile() {
	return fetch.perform("/api/v1.0/profile/", {
		method: "GET"
	});
}

// Update User Personal Profile
export function updatePersonalProfile(body) {
	return fetch.perform("/api/v1.0/profile/update/", {
		method: "POST",
		body: JSON.stringify({
			firstName: body.firstName,
			lastName: body.lastName,
			emailAddress: body.emailAddress,
			bio: body.bio,
			location: body.location,
			website: body.website
		})
	});
}

// Verify User Email Change
export function verifyEmailChange(user) {
	return fetch.perform("/api/v1.0/verify/email_change/", {
		method: "POST",
		body: JSON.stringify({
			code: user.code,
			userId: user.userId,
			workspaceURL: user.workspaceURL
		})
	});
}

// Change User Password
export function changeUserPassword(body) {
	return fetch.perform("/api/v1.0/change_password/", {
		method: "POST",
		body: JSON.stringify({
			currentPassword: body.currentPassword,
			newPassword: body.newPassword,
			confirmPassword: body.confirmPassword
		})
	});
}

// Upload user profile to back-end server for saving
export function saveUserProfilePhoto(body) {}

// Delete existing user profile photo
export function deleteUserProfilePhoto(body) {}
