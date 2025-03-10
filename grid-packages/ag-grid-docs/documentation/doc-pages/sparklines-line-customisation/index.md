---
title: "Sparklines - Line Customisation"
enterprise: true
---

This section shows how Line Sparklines can be customised by overriding the default line options.

The following [Line Sparkline Options](/sparklines-line-customisation/#linesparklineoptions) can be used to customise Line Sparklines:

- [Line Options](/sparklines-line-customisation/#line-options)
- [Marker Options](/sparklines-line-customisation/#marker-options)
- [Sparkline Padding Options](/sparklines-line-customisation/#sparkline-padding-options)

Also see [Additional Customisations](/sparklines-line-customisation/#additional-customisations) for more advanced
customisations that are common across all sparklines.

The snippet below shows option overrides for the Line Sparkline:

```js
sparklineOptions: {
    type: 'line',
    line: {
        stroke: 'rgb(124, 255, 178)',
        strokeWidth: 2
    },
    padding: {
        top: 5,
        bottom: 5
    },
    marker: {
        size: 3,
        shape: 'diamond',
    },
    highlightStyle: {
        size: 10,
    },
}
```

The following example demonstrates the results of the Line Sparkline options above:

<grid-example title='Line Sparkline Customisation' name='line-sparkline-customisation' type='generated' options='{ "enterprise": true, "exampleHeight": 585, "modules": ["clientside", "sparklines"] }'></grid-example>

## Line Options

To apply custom `stroke` and `strokeWidth` attributes to the line, set these properties under `line` options as shown:

```js
sparklineOptions: {
    type: 'line',
    // Customise the line path in the sparkline.
    line: {
        stroke: 'orange',
        strokeWidth: 2,
    },
}
```

The result of the above configuration is displayed below on the right, compared with default `line` options on the left.

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Line customisation" width="250px" constrained="true">Default</image-caption>
    <image-caption src="resources/custom-line.png" alt="Line customisation for highlighted state" width="250px" constrained="true">Custom line</image-caption>
</div>

## Marker Options

The markers are enabled by default but the size has been set to `0`px, making them invisible.

The `size` property in the `highlightStyle` options is `6`px by default, allowing the markers to become visible when in the highlighted state.

These formats can be modified to your liking by setting the `marker` and `highlightStyle` options as demonstated below.

```js
sparklineOptions: {
    type: 'line',
    marker: {
        size: 3,
        shape: 'diamond',
        fill: 'green',
        stroke: 'green',
        strokeWidth: 2
    },
    highlightStyle: {
        size: 10,
        fill: 'cyan',
        stroke: 'cyan',
    },
}
```

- In the snippet above, we have configured the marker size to be `3`px in the un-highlighted normal state, and `10`px in the highlighted state.
- Note that the fill and stroke are also different depending on the highlighted state of the marker.

The result of the above configuration is displayed below, compared with default `marker` options in the first sparkline.

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default.png" alt="Marker customisation" width="250px" constrained="true">Default</image-caption>
    <image-caption src="resources/custom-marker.png" alt="Marker customisation" width="250px" constrained="true">Custom marker</image-caption>
    <image-caption src="resources/custom-highlighted-marker.png" alt="Marker customisation for highlighted state" width="250px" constrained="true">Custom highlighted marker</image-caption>
</div>

## Sparkline Padding Options

To add extra space around the sparklines, custom `padding` options can be applied in the following way.

```js
sparklineOptions: {
    type: 'line',
    // Adjust the padding around the sparklines.
    padding: {
        top: 10,
        right: 5,
        bottom: 10,
        left: 5
    },
}
```

- The `top`, `right`, `bottom` and `left` properties are all optional and can be modified independently.

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/default-padding.png" alt="Padding customisation" width="250px" constrained="true">Default padding</image-caption>
    <image-caption src="resources/custom-padding.png" alt="Padding customisation for highlighted state" width="250px" constrained="true">Custom padding</image-caption>
</div>

## Additional Customisations

More advanced customisations are discussed separately in the following sections:

- [Axis](/sparklines-axis-types/) - configure the x-axis type via `axis` options.
- [Tooltips](/sparklines-tooltips/) - configure tooltips using `tooltip` options.
- [Points of Interest](/sparklines-points-of-interest/) - configure individual points of interest using a `formatter`.

## Interfaces

### LineSparklineOptions

<interface-documentation interfaceName='LineSparklineOptions' overrideSrc='sparklines-line-customisation/resources/line-sparkline-api.json'></interface-documentation>

### SparklineMarkerOptions

<api-documentation source='sparklines-line-customisation/resources/line-sparkline-api.json' section='SparklineMarkerOptions'></api-documentation>

### SparklineAxisOptions

<api-documentation source='sparklines-line-customisation/resources/line-sparkline-api.json' section='SparklineAxisOptions'></api-documentation>

## Next Up


Continue to the next section to learn about: [Sparkline Data](/sparklines-data/).
