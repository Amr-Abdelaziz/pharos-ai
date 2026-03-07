import type React from 'react';

import type { WidgetKey } from '@/features/dashboard/state/presets';

import { ActorsWidget } from './ActorsWidget';
import { BriefWidget } from './BriefWidget';
import { CasualtiesWidget } from './CasualtiesWidget';
import { CommandersWidget } from './CommandersWidget';
import { KeyFactsWidget } from './KeyFactsWidget';
import { LatestEventsWidget } from './LatestEventsWidget';
import { MapWidget } from './MapWidget';
import { PredictionsWidget } from './PredictionsWidget';
import { SignalsWidget } from './SignalsWidget';
import { SituationWidget } from './SituationWidget';

export function widgetComponents(): Record<WidgetKey, () => React.ReactNode> {
  return {
    situation:   () => <SituationWidget />,
    latest:      () => <LatestEventsWidget />,
    actors:      () => <ActorsWidget />,
    signals:     () => <SignalsWidget />,
    map:         () => <MapWidget />,
    keyfacts:    () => <KeyFactsWidget />,
    casualties:  () => <CasualtiesWidget />,
    commanders:  () => <CommandersWidget />,
    predictions: () => <PredictionsWidget />,
    brief:       () => <BriefWidget />,
  };
}
