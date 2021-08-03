/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import CheckCircleOutline from "@material-ui/icons/CheckCircleOutline";
import ErrorOutline from "@material-ui/icons/ErrorOutline";
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
      <div>Your connect code is the way other players will connect to you directly.</div>
      <ConnectCodeSetter user={user} onSuccess={refreshActivation} />
    </div>
  );
};

interface ConnectCodeSetterProps {
  user: firebase.User;
  onSuccess: () => void;
}

const ConnectCodeSetter: React.FC<ConnectCodeSetterProps> = ({ user, onSuccess }) => {
  const getStartTag = (displayName: string | null) => {
    const safeName = displayName || "";
    const matches = safeName.match(/[a-zA-Z]+/g) || [];
    return matches.join("").toUpperCase().substring(0, 4);
  };

  const startTag = getStartTag(user.displayName);

  const [tag, setTag] = React.useState(startTag);
  const [isWorking, setIsWorking] = React.useState(false);
  const [errMessage, setErrMessage] = React.useState("");
  const [tagState, setTagState] = React.useState("short");

  // Handle checking availability on tag change
  const prevTagRef = React.useRef();
  React.useEffect(() => {
    const prevTag = prevTagRef.current;
    ((prevTagRef.current as unknown) as string) = tag;

    // If tag hasn't changed, do nothing
    if (prevTag === tag) {
      return;
    }

    const state = tag.length < 2 ? "short" : "valid";
    setTagState(state);
  }, [tag, user.uid]);

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

  const connectCodeField = (
    <TextField
      css={css`
        max-width: 140px;
        margin: 20px auto 10px auto;
      `}
      key="connectCode"
      name="connectCode"
      id="connectCode"
      label="Connect Code"
      defaultValue={startTag}
      InputProps={{
        endAdornment: <InputAdornment position="end">#123</InputAdornment>,
      }}
      variant="outlined"
      onChange={handleTagChange}
    />
  );

  const renderTagState = () => {
    let icon, text;
    switch (tagState) {
      case "short":
        icon = <ErrorOutline />;
        text = "Too Short";
        break;
      case "valid":
        icon = <CheckCircleOutline />;
        text = "Valid";
        break;
      default:
        return null;
    }

    return (
      <ValidationContainer
        className={tagState}
        css={css`
          margin-top: 25px;
        `}
      >
        {icon}
        <Typography
          variant="body2"
          css={css`
            margin: 4px 0px 0px 5px;
          `}
        >
          {text}
        </Typography>
      </ValidationContainer>
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
          <StyledListItem>2-4 uppercase english characters</StyledListItem>
          <StyledListItem>Trailing numbers will be auto-generated</StyledListItem>
        </ul>
      </Typography>
      <div
        css={css`
          display: flex;
          margin-left: auto;
          margin-right: auto;
          width: 400px;
          flex-direction: column;
        `}
      >
        <div
          css={css`
            display: flex;
            margin-left: auto;
            margin-right: auto;
            width: 200px;
            flex-direction: row;
          `}
        >
          {connectCodeField}
          {renderTagState()}
        </div>

        <Button
          css={css`
            margin-top: 10px;
          `}
          variant="contained"
          color="primary"
          size="large"
          onClick={onConfirmTag}
          disabled={tagState !== "valid" || isWorking}
        >
          {isWorking ? <CircularProgress color="inherit" size={29} /> : "Confirm Code"}
        </Button>
      </div>
      {errorDisplay}
    </form>
  );
};

const StyledListItem = styled.li`
  margin: 4px 0;
`;

const ValidationContainer = styled.div`
  display: flex;
  margin: 15px 0px 0px 5px;
  &.short {
    color: ${({ theme }) => theme.palette.error.main};
  }
  &.valid {
    color: ${({ theme }) => theme.palette.success.main};
  }
`;
