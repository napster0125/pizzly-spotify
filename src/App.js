import { useState } from "react";
import { Box, Typography, Button } from "@material-ui/core";
import Pizzly from "pizzly-js";

import { makeStyles } from "@material-ui/core/styles";
import { red } from "@material-ui/core/colors";
import { Card, CardHeader, CardContent, Avatar } from "@material-ui/core";
import "./App.css";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: 500,
  },
  avatar: {
    backgroundColor: red[500],
  },
}));

const pizzly = new Pizzly({
  host: process.env.REACT_APP_PIZZLY_HOSTNAME,
  secretKey: process.env.REACT_APP_PIZZLY_SECRET_KEY,
});

const integrationPlatform = "spotify";
const pizzlySpotify = pizzly.integration(integrationPlatform);

async function requestPizzly(path, authId, httpMethod, body) {
  let response;
  console.log({ path, authId, httpMethod, body });
  if (httpMethod === "GET") {
    response = await pizzlySpotify.auth(authId).get(path);
  } else if (httpMethod === "POST") {
    response = await pizzlySpotify.auth(authId).post(path, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } else if (httpMethod === "DELETE") {
    response = await pizzlySpotify.auth(authId).delete(path, {
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = response.status === 204 ? null : await response.json();
  console.log(data);

  if (response.ok) {
    return data;
  } else {
    // throw new Error(JSON.stringify(data));
    throw data;
  }
}

const SpotifyData = ({ profile, playlists }) => {
  const classes = useStyles();
  console.log("Playlists:", playlists);
  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar}>
            S
          </Avatar>
        }
        title={profile.displayName}
        subheader={profile.uri}
      />
      {playlists.items &&
        playlists.items.map((item) => <CardContent>{item.name}</CardContent>)}
    </Card>
  );
};

function App() {
  const [spotifyProfile, setSpotifyProfile] = useState({});
  const [spotifyPlaylist, setSpotifyPlaylist] = useState({});

  const profileEndpoint = "me";
  const playlistEndpoint = "me/playlists";

  async function getSpotifyInfomation(authId) {
    const profileRes = await requestPizzly(profileEndpoint, authId, "GET");
    setSpotifyProfile({
      displayName: profileRes.display_name,
      type: profileRes.type,
      uri: profileRes.uri,
    });

    // get 20 playlists
    const playlistRes = await requestPizzly(playlistEndpoint, authId, "GET");
    setSpotifyPlaylist({ items: playlistRes.items });
  }

  const handleClickSpotify = (e) => {
    e && e.preventDefault();
    console.log(
      "connect spotify:",
      process.env.REACT_APP_PIZZLY_SETUP_ID_SPOTIFY_APP
    );

    pizzlySpotify
      .connect({
        setupId: process.env.REACT_APP_PIZZLY_SETUP_ID_SPOTIFY_APP,
      })
      .then(({ authId }) => {
        console.log("Sucessfully connected!", integrationPlatform, authId);
        getSpotifyInfomation(authId);
      })
      .catch((error) => console.log("Error:", error));
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      justifyItems="center"
      minHeight="100vh"
    >
      {!spotifyProfile.displayName ? (
        <>
          <Typography>This is the Spotify Music Player</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleClickSpotify}
          >
            Click to login Spotify
          </Button>
        </>
      ) : (
        <SpotifyData profile={spotifyProfile} playlists={spotifyPlaylist} />
      )}
    </Box>
  );
}

export default App;
