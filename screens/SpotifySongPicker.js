import React, { useState } from "react";
import { View, TextInput, FlatList, Text, Pressable } from "react-native";
import axios from "axios";

const clientId = "YOUR_CLIENT_ID";
const clientSecret = "YOUR_CLIENT_SECRET";

const getSpotifyToken = async () => {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
    }
  );
  return response.data.access_token;
};

const SpotifySongPicker = ({ navigation, route }) => {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);

  const searchSongs = async () => {
    const token = await getSpotifyToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSongs(response.data.tracks.items);
  };

  const sendSong = (song) => {
    // Navigate back with selected song
    navigation.navigate("ChatRoom", { selectedSong: song });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        placeholder="Search for a song..."
        value={query}
        onChangeText={setQuery}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
        }}
      />
      <Pressable
        onPress={searchSongs}
        style={{
          backgroundColor: "#1DB954",
          padding: 10,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Search</Text>
      </Pressable>
      
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => sendSong(item)}
            style={{ padding: 10, borderBottomWidth: 1, borderColor: "#ddd" }}
          >
            <Text>{item.name} - {item.artists[0].name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

export default SpotifySongPicker;
