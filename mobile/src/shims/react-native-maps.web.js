/**
 * Web stub for react-native-maps.
 * On web we render plain <View> placeholders so the rest of the app still loads.
 */
import React from "react";
import { View, Text } from "react-native";

function MapView({ style, children, ...rest }) {
  return (
    <View
      style={[
        {
          backgroundColor: "#e8f4f4",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        style,
      ]}
      {...rest}
    >
      <Text style={{ color: "#0E7C7B", fontSize: 13, fontWeight: "600" }}>
        🗺️ Map (native only)
      </Text>
      {children}
    </View>
  );
}

function Noop() {
  return null;
}

MapView.Marker = Noop;
MapView.Circle = Noop;
MapView.Polyline = Noop;
MapView.Polygon = Noop;
MapView.Callout = Noop;
MapView.CalloutSubview = Noop;
MapView.Heatmap = Noop;
MapView.Overlay = Noop;

export default MapView;
export const Marker = Noop;
export const Circle = Noop;
export const Polyline = Noop;
export const Polygon = Noop;
export const Callout = Noop;
export const CalloutSubview = Noop;
export const Heatmap = Noop;
export const Overlay = Noop;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = null;
