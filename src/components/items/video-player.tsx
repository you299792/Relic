import React, { useCallback, useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';

interface ItemVideoPlayerProps {
  uri: string;
  thumbnail?: string | null;
}

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  // Pause whenever the screen loses focus (e.g. back button) or unmounts.
  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {
          // player already released
        }
      };
    }, [player])
  );

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="contain"
      nativeControls
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture
    />
  );
}

export function ItemVideoPlayer({ uri, thumbnail }: ItemVideoPlayerProps) {
  const [started, setStarted] = useState(!thumbnail);

  return (
    <View className="w-full h-56 rounded-[24px] overflow-hidden bg-black mb-5">
      {started ? (
        <Player uri={uri} />
      ) : (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setStarted(true)} className="w-full h-full">
          <Image source={{ uri: thumbnail! }} className="w-full h-full" resizeMode="cover" />
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/50 w-16 h-16 rounded-full items-center justify-center">
              <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Paused, muted first-frame preview used as a card thumbnail when no image was chosen.
export function VideoThumbnail({ uri, className }: { uri: string; className?: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.pause();
  });

  return (
    <View className={`w-full bg-black ${className ?? 'h-48'}`} pointerEvents="none">
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
      />
      <View className="absolute inset-0 items-center justify-center">
        <View className="bg-black/50 w-11 h-11 rounded-full items-center justify-center">
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}
