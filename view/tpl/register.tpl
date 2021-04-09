<div class="generic-content-wrapper">
	<div class="section-title-wrapper">
		<h2>{{$title}}</h2>
	</div>
	<div class="section-content-wrapper">
		<form action="register" method="post" id="register-form">
			<input type='hidden' name='form_security_token' value='{{$form_security_token}}'>
			{{if $reg_is || $other_sites || $now || $msg}}
			<div class="section-content-warning-wrapper">
				<div class="h3">{{$now}}</div>
				<div id="register-desc" class="descriptive-paragraph">{{$msg}}</div>
				<div id="register-desc" class="descriptive-paragraph">{{$reg_is}}</div>
				<div id="register-sites" class="descriptive-paragraph">{{$other_sites}}</div>
			</div>
			{{/if}}
			{{if $registertext}}
			<div class="section-content-info-wrapper">
				<div id="register-text" class="descriptive-paragraph">{{$registertext}}</div>
			</div>
			{{/if}}

			{{if $invitations}}
			<a id="zar014" href="javascript:;" style="display: inline-block;">{{$haveivc}}</a>
			<div id="zar015" style="display: none;">
				<div class="position-relative">
					<div id="invite-spinner" class="spinner-wrapper position-absolute" style="top: 2.5rem; right: 0.5rem;"><div class="spinner s"></div></div>
					{{include file="field_input.tpl" field=[$invite_code.0,$invite_code.1,"","",""]}}
				</div>
			</div>
			{{/if}}

			{{if $auto_create}}
			<div class="position-relative">
				<div id="name-spinner" class="spinner-wrapper position-absolute" style="top: 2.5rem; right: 0.5rem;"><div class="spinner s"></div></div>
				{{include file="field_input.tpl" field=[$name.0,$name.1,"","","",$atform]}}
			</div>
			<div class="position-relative">
				<div id="nick-spinner" class="spinner-wrapper position-absolute" style="top: 2.5rem; right: 0.5rem;"><div class="spinner s"></div></div>
				{{include file="field_input.tpl" field=[$nickname.0,$nickname.1,"","","",$atform]}}
			</div>
			{{/if}}

			<div>

			{{include file="field_input.tpl" field=$email}}
			</div>

			{{include file="field_password.tpl" field=$pass1}}

			{{include file="field_password.tpl" field=$pass2}}


			{{if $enable_tos}}
			{{include file="field_checkbox.tpl" field=[$tos.0,$tos.1,"","","",$atform]}}
			{{else}}
			<input type="hidden" name="tos" value="1" />
			{{/if}}

			<button class="btn btn-primary" type="submit" name="submit" id="newchannel-submit-button" value="{{$submit}}" {{$atform}}>{{$submit}}</button>
			<div id="register-submit-end" class="register-field-end"></div>
		</form>
	</div>
</div>
