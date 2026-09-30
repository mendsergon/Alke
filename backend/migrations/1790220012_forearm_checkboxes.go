package migrations

import (
	"fmt"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// A forearm exercise ticks the parts it trains most — any of the extending
// side, the curling side and the brachialis, up to all three (Stavros,
// 30 September 2026) — so weights_forearms has a checkbox per muscle in place
// of a single choice. A choice already made stays ticked.
func init() {
	m.Register(func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(WeightsCollection("Forearms"))
		if err != nil {
			return err
		}
		if _, ok := col.Fields.GetByName("main_muscle").(*core.SelectField); !ok {
			return nil // already checkboxes
		}
		category, err := app.FindFirstRecordByFilter("muscle_categories", "name = 'Forearms'")
		if err != nil {
			return err
		}
		muscles, err := app.FindRecordsByFilter("muscles", "category = {:c}", "position", 0, 0, dbx.Params{"c": category.Id})
		if err != nil {
			return err
		}

		records, err := app.FindAllRecords(col)
		if err != nil {
			return err
		}
		chosen := map[string]string{}
		for _, r := range records {
			chosen[r.Id] = r.GetString("main_muscle")
		}

		col.RemoveIndex("idx_" + col.Name + "_main_muscle")
		col.Fields.RemoveByName("main_muscle")
		for _, mu := range muscles {
			col.Fields.Add(&core.BoolField{
				Name: MuscleField(mu.GetString("name")),
				Help: fmt.Sprintf("Ticked: %s is a main muscle of it. Tick every one it trains most.", mu.GetString("name")),
			})
		}
		if err := app.Save(col); err != nil {
			return err
		}
		for _, r := range records {
			if chosen[r.Id] == "" {
				continue
			}
			r.Set(MuscleField(chosen[r.Id]), true)
			if err := app.Save(r); err != nil {
				return fmt.Errorf("%s: %w", r.GetString("name"), err)
			}
		}
		return nil
	}, nil)
}

// MuscleField names a muscle's checkbox: its name, lower case, spaces as
// underscores (Forearm flexors: forearm_flexors).
func MuscleField(muscle string) string {
	return strings.ReplaceAll(strings.ToLower(muscle), " ", "_")
}
