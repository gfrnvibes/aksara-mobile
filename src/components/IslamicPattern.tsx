import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Polygon } from 'react-native-svg';

export function IslamicPattern({ opacity = 0.1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 360 180" preserveAspectRatio="xMaxYMid slice">
        <G transform="translate(295, 45)">
          <Polygon
            points="0,-52 15,-15 52,0 15,15 0,52 -15,15 -52,0 -15,-15"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
          <Polygon
            points="0,-52 15,-15 52,0 15,15 0,52 -15,15 -52,0 -15,-15"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            transform="rotate(45)"
          />
          <Circle cx="0" cy="0" r="22" fill="none" stroke="#fbbf24" strokeWidth="1" />
          <Circle cx="0" cy="0" r="64" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="4 4" />
        </G>
        <G transform="translate(40, 145)">
          <Polygon
            points="0,-32 9,-9 32,0 9,9 0,32 -9,9 -32,0 -9,-9"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <Polygon
            points="0,-32 9,-9 32,0 9,9 0,32 -9,9 -32,0 -9,-9"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1"
            transform="rotate(45)"
          />
        </G>
      </Svg>
    </View>
  );
}
