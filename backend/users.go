package main

import (
	"github.com/pocketbase/pocketbase/core"
)

// subscription_status is set by server code only. A client request that
// carries it in any form is refused, whoever sends it — a person, a signed-in
// user, a superuser — so the one way to change it is `app.Save` in Go. A new
// account starts free.
const subscriptionField = "subscription_status"

// The body keys that reach the field: plain, and the select modifiers
// (`core/field_select.go`, FindSetter). A record request's body arrives with
// the modifiers already folded into the plain name — printed from the hook,
// `subscription_status+` reaches it as `subscription_status` — so there the
// plain key is enough; OAuth2's createData is the client's own map, unfolded,
// and needs the full list.
var subscriptionKeys = []string{
	subscriptionField,
	"+" + subscriptionField,
	subscriptionField + "+",
	subscriptionField + "-",
}

func carriesSubscription(body map[string]any) bool {
	for _, k := range subscriptionKeys {
		if _, ok := body[k]; ok {
			return true
		}
	}
	return false
}

func refuseSubscription(e *core.RecordRequestEvent) error {
	info, err := e.RequestInfo()
	if err != nil {
		return err
	}
	if carriesSubscription(info.Body) {
		return e.BadRequestError("The subscription is set by the server.", nil)
	}
	return nil
}

func bindUsers(app core.App) {
	app.OnRecordCreateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		if err := refuseSubscription(e); err != nil {
			return err
		}
		e.Record.Set(subscriptionField, "free")
		return e.Next()
	})

	app.OnRecordUpdateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		if err := refuseSubscription(e); err != nil {
			return err
		}
		return e.Next()
	})

	// OAuth2 sign-up builds the new account from client-sent createData.
	app.OnRecordAuthWithOAuth2Request("users").BindFunc(func(e *core.RecordAuthWithOAuth2RequestEvent) error {
		if carriesSubscription(e.CreateData) {
			return e.BadRequestError("The subscription is set by the server.", nil)
		}
		if e.IsNewRecord {
			if e.CreateData == nil {
				e.CreateData = map[string]any{}
			}
			e.CreateData[subscriptionField] = "free"
		}
		return e.Next()
	})
}
