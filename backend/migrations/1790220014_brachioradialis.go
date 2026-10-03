package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The forearm's outer, thumb-side muscle is the brachioradialis (Stavros,
// 3 October 2026), not "Forearm extensors": the muscle and its checkbox on
// weights_forearms take that name. The checkbox keeps its id, so what is
// ticked stays ticked.
func init() {
	m.Register(func(app core.App) error {
		r, err := app.FindFirstRecordByFilter("muscles", "name = 'Forearm extensors'")
		if err == nil {
			r.Set("name", "Brachioradialis")
			r.Set("figure", "Brachioradialis") // the body figure's name for its regions
			if err := app.Save(r); err != nil {
				return err
			}
		}

		col, err := app.FindCollectionByNameOrId(WeightsCollection("Forearms"))
		if err != nil {
			return err
		}
		f, ok := col.Fields.GetByName(MuscleField("Forearm extensors")).(*core.BoolField)
		if !ok {
			return nil
		}
		f.Name = MuscleField("Brachioradialis")
		f.Help = "Ticked: Brachioradialis is a main muscle of it. Tick every one it trains most."
		return app.Save(col)
	}, nil)
}
