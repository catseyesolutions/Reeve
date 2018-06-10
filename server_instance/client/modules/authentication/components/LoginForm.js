import React, { Component } from "react";
import PropTypes from "prop-types";
import { t } from "~/shared/translations/i18n";

import InputField from "../../../common/components/inputs/InputField";

class LoginForm extends Component {
	render() {
		const { emailAddress, password, loginPending, workspaceURLPending, keepSignedIn, login, handleChecked, style, errors } = this.props;

		return (
			<div>
				<div className="w-100 mb-3">
					<span className="h3">{t("action.login")}</span>
				</div>
				<InputField
					label={t("label.emailAddress")}
					name="emailAddress"
					id={"email-input"}
					value={emailAddress}
					type={"textField"}
					ariaLabel={"emailAddress"}
					onChange={this.changeField}
					disabled={loginPending || workspaceURLPending}
					error={errors}
				/>
				<InputField
					label={t("label.password")}
					name="password"
					id={"password-input"}
					value={password}
					type={"password"}
					ariaLabel={"Password"}
					onChange={this.changeField}
					disabled={loginPending || workspaceURLPending}
					error={errors}
				/>
				<div className="form-row pl-4 pr-1">
					<div className="col">
						<input
							id="signedInCheck"
							name="keepSignedIn"
							className="form-check-input"
							type="checkbox"
							value={keepSignedIn}
							onClick={handleChecked}
							disabled={loginPending || workspaceURLPending}
						/>
						<label className="form-check-label" htmlFor="signedInCheck">
							{t("components.authentication.keepSignedIn")}
						</label>
					</div>
					<div className="col text-right">{t("components.authentication.forgotPassword")}</div>
				</div>
				<button type="button" className={`btn btn-primary btn-lg btn-block mt-4 p-3 ${style.button}`} onClick={login} disabled={loginPending || workspaceURLPending}>
					{t("action.login")}
				</button>
				<div className="mt-4">
					<span>{t("components.authentication.noAccount")}</span> <a href="#">{t("action.register")}</a>
				</div>
			</div>
		);
	}
}

LoginForm.propTypes = {
	emailAddress: PropTypes.string,
	password: PropTypes.string,
	loginPending: PropTypes.bool,
	workspaceURLPending: PropTypes.bool,
	keepSignedIn: PropTypes.bool,
	login: PropTypes.func,
	handleChecked: PropTypes.func,
	style: PropTypes.object,
	errors: PropTypes.object
};

export default LoginForm;
