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
import { Controller, useForm } from "react-hook-form";

import { useAccount } from "@/lib/hooks/useAccount";
import { initNetplay } from "@/lib/slippiBackend";
import { isValidConnectCodeStart } from "@/lib/validate";

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

interface FormValues {
  tag: string;
}

const ConnectCodeSetter: React.FC<ConnectCodeSetterProps> = ({ user, onSuccess }) => {
  const getStartTag = (displayName: string | null) => {
    const safeName = displayName || "";
    const matches = safeName.match(/[a-zA-Z]+/g) || [];
    return matches.join("").toUpperCase().substring(0, 4);
  };

  const startTag = getStartTag(user.displayName);
  const defaultValues = { tag: startTag };

  const [isWorking, setIsWorking] = React.useState(false);
  const [errMessage, setErrMessage] = React.useState("");

  const { handleSubmit, watch, control, setValue } = useForm<FormValues>({ defaultValues });

  const tag = watch("tag");

  // // Handle checking availability on tag change
  // const prevTagRef = React.useRef();
  // React.useEffect(() => {
  //   const prevTag = prevTagRef.current;
  //   ((prevTagRef.current as unknown) as string) = tag;

  //   // If tag hasn't changed, do nothing
  //   if (prevTag === tag) {
  //     return;
  //   }

  //   const state = tag.length < 2 ? "Too Short" : "Valid";
  //   setTagState(state);
  // }, [tag, user.uid]);

  // const handleTagChange = (event: any) => {
  //   let newTag = event.target.value;

  //   // Only allow english characters and capitalize them
  //   const safeTag = newTag || "";
  //   const matches = safeTag.match(/[a-zA-Z]+/g) || [];
  //   newTag = matches.join("").toUpperCase().substring(0, 4);
  //   event.target.value = newTag;

  //   setTag(newTag);
  //   setErrMessage("");
  // };

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

  const onFormSubmit = handleSubmit(onConfirmTag);

  const connectCodeField = (
    <Controller
      name="tag"
      control={control}
      defaultValue=""
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          required={true}
          css={css`
            max-width: 140px;
            margin: 20px auto 10px auto;
          `}
          label="Connect Code"
          InputProps={{
            endAdornment: <InputAdornment position="end">#123</InputAdornment>,
          }}
          variant="outlined"
          error={Boolean(error)}
          helperText={error ? error.message : undefined}
        />
      )}
      rules={{
        validate: (val) => {
          const adjustedCode = val.toUpperCase().substring(0, 4);
          setValue("tag", adjustedCode);
          return isValidConnectCodeStart(adjustedCode);
        },
      }}
    />
  );

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
    <form className="form" onSubmit={onFormSubmit}>
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
        {connectCodeField}

        <Button
          css={css`
            margin-top: 10px;
          `}
          variant="contained"
          color="primary"
          size="large"
          type="submit"
          disabled={isWorking}
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
