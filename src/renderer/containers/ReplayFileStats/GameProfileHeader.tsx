/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import EventIcon from "@material-ui/icons/Event";
import LandscapeIcon from "@material-ui/icons/Landscape";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import SportsEsportsIcon from "@material-ui/icons/SportsEsports";
import TimerIcon from "@material-ui/icons/Timer";
import { FileResult } from "@replays/types";
import { GameStartType, MetadataType, stages as stageUtils, StatsType } from "@slippi/slippi-js";
import { colors } from "common/colors";
import { extractPlayerNames } from "common/matchNames";
import { convertFrameCountToDurationString, monthDayHourFormat } from "common/time";
import _ from "lodash";
import moment from "moment";
import React from "react";

import { getStageImage } from "@/lib/utils";

import { PlayerInfo } from "./PlayerInfo";

const Outer = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
`;

interface PlayerInfoDisplayProps {
  settings: GameStartType;
  metadata: MetadataType | null;
}

const PlayerInfoDisplay: React.FC<PlayerInfoDisplayProps> = ({ settings, metadata }) => {
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();

  const elements: JSX.Element[] = [];
  teams.forEach((team, idx) => {
    const teamEls = team.map((player) => {
      const names = extractPlayerNames(player.playerIndex, settings, metadata);
      return (
        <PlayerInfo
          key={`player-${player.playerIndex}`}
          player={player}
          isTeams={Boolean(settings.isTeams)}
          names={names}
        />
      );
    });
    elements.push(
      <div
        key={`team-${idx}`}
        css={css`
          display: flex;
        `}
      >
        {...teamEls}
      </div>,
    );

    // Add VS obj in between teams
    if (idx < teams.length - 1) {
      // If this is not the last team, add a "vs" element
      elements.push(
        <div
          key={`vs-${idx}`}
          css={css`
            font-weight: bold;
            color: rgba(255, 255, 255, 0.5);
            padding: 0 10px;
            font-size: 20px;
          `}
        >
          vs
        </div>,
      );
    }
  });
  return <Outer>{...elements}</Outer>;
};

export interface GameProfileHeaderProps {
  file: FileResult;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onClose: () => void;
  loading?: boolean;
  stats: StatsType | null;
}

export const GameProfileHeader: React.FC<GameProfileHeaderProps> = ({
  stats,
  loading,
  file,
  index,
  total,
  onNext,
  onPrev,
  onPlay,
  onClose,
}) => {
  const { metadata, settings } = file;
  const stageImage = settings.stageId !== null ? getStageImage(settings.stageId) : undefined;
  return (
    <Header backgroundImage={stageImage}>
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <div
          css={css`
            display: flex;
            flex-direction: column;
          `}
        >
          <div
            css={css`
              display: flex;
              align-items: center;
            `}
          >
            <div>
              <Tooltip title="Back to replays">
                <span>
                  <IconButton
                    onClick={onClose}
                    disabled={loading}
                    css={css`
                      padding: 8px;
                    `}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </div>
            <PlayerInfoDisplay metadata={metadata} settings={settings} />
          </div>
          <GameDetails file={file} stats={stats} />
        </div>
        <Controls disabled={loading} index={index} total={total} onNext={onNext} onPrev={onPrev} onPlay={onPlay} />
      </div>
    </Header>
  );
};

const Header = styled.div<{
  backgroundImage?: any;
}>`
  z-index: 1;
  top: 0;
  width: 100%;
  border-bottom: solid 2px ${colors.purpleDark};
  background-size: cover;
  background-position: center center;
  background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0 30%, rgba(0, 0, 0, 0.8) 90%)
    ${(p) =>
      p.backgroundImage
        ? `,
    url("${p.backgroundImage}")`
        : ""};
`;

const GameDetails: React.FC<{
  file: FileResult;
  stats: StatsType | null;
}> = ({ file, stats }) => {
  let stageName = "Unknown";
  try {
    stageName = stageUtils.getStageName(file.settings.stageId !== null ? file.settings.stageId : 0);
  } catch (err) {
    console.error(err);
  }

  const platform = _.get(file.metadata, "playedOn") || "Unknown";

  const startAtDisplay = new Date(file.startTime ? Date.parse(file.startTime) : 0);

  // Sometimes metadata doesn't exist and won't have the last frame
  // but we might have the stats computed which contains the real last frame.
  // In that situation, we should use that lastFrame not the metadata one.
  let duration = _.get(file.metadata, "lastFrame");
  if (duration === null || duration === undefined) {
    duration = _.get(stats, "lastFrame");
  }
  const durationLength =
    duration !== null && duration !== undefined ? convertFrameCountToDurationString(duration, "m[m] ss[s]") : "Unknown";

  const displayData = [
    {
      label: <EventIcon />,
      content: monthDayHourFormat(moment(startAtDisplay)) as string,
    },
    {
      label: <LandscapeIcon />,
      content: stageName,
    },
    {
      label: <TimerIcon />,
      content: durationLength,
    },
    {
      label: <SportsEsportsIcon />,
      content: platform,
    },
  ];

  const metadataElements = displayData.map((details, i) => {
    return (
      <div
        key={`item-${i}-${details.content}`}
        css={css`
          margin: 10px;
          display: flex;
          align-items: center;
          font-size: 14px;
        `}
      >
        <DetailLabel>{details.label}</DetailLabel>
        <DetailContent>{details.content}</DetailContent>
      </div>
    );
  });

  return (
    <div
      css={css`
        display: flex;
        padding: 0 10px;
      `}
    >
      {metadataElements}
    </div>
  );
};

const Controls: React.FC<{
  disabled?: boolean;
  index: number;
  total: number;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ disabled, index, total, onPlay, onPrev, onNext }) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        margin: 10px;
      `}
    >
      <div>
        <Button variant="contained" onClick={onPlay} color="primary" startIcon={<PlayArrowIcon />}>
          Launch Replay
        </Button>
      </div>
      <div
        css={css`
          margin-top: 10px;
          display: grid;
          grid-auto-flow: column;
          align-items: center;
          justify-content: center;
          grid-gap: 10px;
          font-size: 13px;
        `}
      >
        <Tooltip title="Previous replay">
          <span>
            <IconButton disabled={disabled || index === 0} onClick={onPrev} size="small">
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <span>
          {index + 1} / {total}
        </span>
        <Tooltip title="Next replay">
          <span>
            <IconButton disabled={disabled || index === total - 1} onClick={onNext} size="small">
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

const DetailLabel = styled.label`
  display: flex;
  align-items: center;
  font-weight: bold;
  opacity: 0.6;
  margin-right: 5px;
  svg {
    font-size: 22px;
  }
`;

// `text-transform: capitalize` doesn't work unless it's an inline-block
// See: https://stackoverflow.com/a/49783868 for more info
const DetailContent = styled.label`
  text-transform: capitalize;
  display: inline-block;
`;
