import React, { PureComponent } from 'react';
import { Input, TimeZonePicker, Field, Switch, CollapsableSection } from '@grafana/ui';
import { rangeUtil, TimeZone } from '@grafana/data';
import { isEmpty } from 'lodash';
import { selectors } from '@grafana/e2e-selectors';
import { AutoRefreshIntervals } from './AutoRefreshIntervals';

interface Props {
  onTimeZoneChange: (timeZone: TimeZone) => void;
  onRefreshIntervalChange: (interval: string[]) => void;
  onNowDelayChange: (nowDelay: string) => void;
  onMaxTimeRangeChange: (maxTimeRange: string) => void;
  onOldestFromChange: (oldestFrom: string) => void;
  onHideTimePickerChange: (hide: boolean) => void;
  refreshIntervals: string[];
  timePickerHidden: boolean;
  nowDelay: string;
  maxTimeRange: string;
  oldestFrom: string;
  timezone: TimeZone;
}

interface State {
  isNowDelayValid: boolean;
  isMaxTimeRangeValid: boolean;
  isOldestFromValid: boolean;
}

export class TimePickerSettings extends PureComponent<Props, State> {
  state: State = { isNowDelayValid: true, isMaxTimeRangeValid: true, isOldestFromValid: true };

  onNowDelayChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;

    if (isEmpty(value)) {
      this.setState({ isNowDelayValid: true });
      return this.props.onNowDelayChange(value);
    }

    if (rangeUtil.isValidTimeSpan(value)) {
      this.setState({ isNowDelayValid: true });
      return this.props.onNowDelayChange(value);
    }

    this.setState({ isNowDelayValid: false });
  };

  onMaxTimeRangeChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;

    if (isEmpty(value)) {
      this.setState({ isMaxTimeRangeValid: true });
      return this.props.onMaxTimeRangeChange(value);
    }

    if (value.match(/^[1-9]\d*(ms|[yMwdhms])$/)) {
      this.setState({ isMaxTimeRangeValid: true });
      return this.props.onMaxTimeRangeChange(value);
    }

    this.setState({ isMaxTimeRangeValid: false });
  };

  onOldestFromChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;

    if (isEmpty(value)) {
      this.setState({ isOldestFromValid: true });
      return this.props.onOldestFromChange(value);
    }

    if (value.match(/^[1-9]\d*(ms|[yMwdhms])$/)) {
      this.setState({ isOldestFromValid: true });
      return this.props.onOldestFromChange(value);
    }

    this.setState({ isOldestFromValid: false });
  };

  onHideTimePickerChange = () => {
    this.props.onHideTimePickerChange(!this.props.timePickerHidden);
  };

  onTimeZoneChange = (timeZone: string) => {
    if (typeof timeZone !== 'string') {
      return;
    }
    this.props.onTimeZoneChange(timeZone);
  };

  render() {
    return (
      <CollapsableSection label="Time options" isOpen={true}>
        <Field label="Timezone" aria-label={selectors.components.TimeZonePicker.container}>
          <TimeZonePicker
            includeInternal={true}
            value={this.props.timezone}
            onChange={this.onTimeZoneChange}
            width={40}
          />
        </Field>
        <AutoRefreshIntervals
          refreshIntervals={this.props.refreshIntervals}
          onRefreshIntervalChange={this.props.onRefreshIntervalChange}
        />
        <Field
          label="Now delay now"
          description="Enter 1m to ignore the last minute. It might contain incomplete metrics."
        >
          <Input
            invalid={!this.state.isNowDelayValid}
            placeholder="0m"
            onChange={this.onNowDelayChange}
            defaultValue={this.props.nowDelay}
          />
        </Field>
        <Field
           label="Max time range"
           description="Limits users to the specified time interval."
        >
          <Input
            invalid={!this.state.isMaxTimeRangeValid}
            onChange={this.onMaxTimeRangeChange}
            defaultValue={this.props.maxTimeRange}
          />
        </Field>
        <Field
           label="Oldest 'from' time"
           description="Prevents the user from selecting a time range starting further back in the past than the specified interval."
        >
          <Input
            invalid={!this.state.isOldestFromValid}
            onChange={this.onOldestFromChange}
            defaultValue={this.props.oldestFrom}
          />
        </Field>
        <Field label="Hide time picker">
          <Switch value={!!this.props.timePickerHidden} onChange={this.onHideTimePickerChange} />
        </Field>
      </CollapsableSection>
    );
  }
}
