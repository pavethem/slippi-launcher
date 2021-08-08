/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Alert from "@material-ui/lab/Alert";
import electronLog from "electron-log";
import firebase from "firebase";
import React from "react";

import { useAccount } from "@/lib/hooks/useAccount";
import { initNetplay } from "@/lib/slippiBackend";

const log = electronLog.scope("ActivateOnlineForm");

export const ActivateOnlineForm: React.FC = () => {
  const user = useAccount((store) => store.user) as firebase.User;
  const refreshActivation = useAccount((store) => store.refreshPlayKey);
  return (
    <div>
      <div>Your connect code is used for players to connect with you directly.</div>
      <ConnectCodeSetter displayName={user.displayName || ""} onSuccess={refreshActivation} />
    </div>
  );
};

interface ConnectCodeSetterProps {
  displayName: string;
  onSuccess: () => void;
}

const ConnectCodeSetter: React.FC<ConnectCodeSetterProps> = ({ displayName, onSuccess }) => {
  const getStartTag = () => {
    const safeName = displayName;
    const matches = safeName.match(/[a-zA-Z]+/g) || [];
    return matches.join("").toUpperCase().substring(0, 4);
  };

  const startTag = getStartTag();

  const [tag, setTag] = React.useState(startTag);
  const [isWorking, setIsWorking] = React.useState(false);
  const [errMessage, setErrMessage] = React.useState("");
  const [tagState, setTagState] = React.useState("short");

  const prevTagRef = React.useRef();
  React.useEffect(() => {
    const prevTag = prevTagRef.current;
    ((prevTagRef.current as unknown) as string) = tag;

    // If tag hasn't changed, do nothing
    if (prevTag === tag) {
      return;
    }

    const state = tag.length < 2 ? "Too short" : "";
    setTagState(state);
  }, [tag, displayName]);

  const handleTagChange = (event: any) => {
    let newTag = event.target.value;

    // Only allow english characters and capitalize them
    const safeTag = newTag || "";
    const matches = safeTag.match(/[a-zA-Z]+/g) || [];
    newTag = matches.join("").toUpperCase().substring(0, 4);
    event.target.value = newTag;

    setTag(newTag);
    setErrMessage("");
  };

  const onConfirmTag = () => {
    setErrMessage("");
    setIsWorking(true);

    initNetplay(tag).then(
      () => {
        onSuccess();
        setIsWorking(false);
      },
      (err: Error) => {
        setErrMessage(err.message);
        log.error(err);
        setIsWorking(false);
      },
    );
  };

  let errorDisplay = null;
  if (errMessage) {
    errorDisplay = (
      <Alert
        css={css`
          margin-top: 8px;
        `}
        variant="outlined"
        severity="error"
      >
        {errMessage}
      </Alert>
    );
  }

  return (
    <form>
      <Typography component="div" variant="body2" color="textSecondary">
        <ul
          css={css`
            padding-left: 33px;
            margin: 6px 0;
          `}
        >
          <StyledListItem>2-4 uppercase English characters</StyledListItem>
          <StyledListItem>Trailing numbers will be auto-generated</StyledListItem>
          <StyledListItem>Can be changed later for a one-time payment</StyledListItem>
        </ul>
      </Typography>
      <div
        css={css`
          display: flex;
          margin-left: auto;
          margin-right: auto;
          width: 400px;
          height: 150px;
          flex-direction: column;
          position: relative;
        `}
      >
        <TextField
          css={css`
            max-width: 200px;
            margin: 20px auto 10px auto;
            padding-bottom: 20px;
          `}
          label="Connect code"
          defaultValue={startTag}
          error={Boolean(tagState)}
          helperText={tagState}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: <InputAdornment position="end">#123</InputAdornment>,
          }}
          variant="outlined"
          onChange={handleTagChange}
        />

        <Button
          css={css`
            margin: 10px auto 0 auto;
            position: absolute;
            width: 400px;
            bottom: 0px;
          `}
          variant="contained"
          color="primary"
          size="large"
          onClick={onConfirmTag}
          disabled={Boolean(tagState) || isWorking}
        >
          {isWorking ? <CircularProgress color="inherit" size={29} /> : "Confirm code"}
        </Button>
      </div>
      {errorDisplay}
    </form>
  );
};

const StyledListItem = styled.li`
  margin: 4px 0;
`;
