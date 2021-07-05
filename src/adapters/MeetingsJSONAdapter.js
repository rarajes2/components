import {concat, fromEvent, Observable} from 'rxjs';
import {filter, map, takeWhile} from 'rxjs/operators';
import {MeetingsAdapter, MeetingState} from '@webex/component-adapter-interfaces';

import DisabledJoinControl from './MeetingsJSONAdapter/controls/DisabledJoinControl';
import DisabledMuteAudioControl from './MeetingsJSONAdapter/controls/DisabledMuteAudioControl';
import JoinControl from './MeetingsJSONAdapter/controls/JoinControl';
import LeaveControl from './MeetingsJSONAdapter/controls/LeaveControl';
import MuteAudioControl from './MeetingsJSONAdapter/controls/MuteAudioControl';
import MuteVideoControl from './MeetingsJSONAdapter/controls/MuteVideoControl';
import ProceedWithoutCameraControl from './MeetingsJSONAdapter/controls/ProceedWithoutCameraControl';
import ProceedWithoutMicrophoneControl from './MeetingsJSONAdapter/controls/ProceedWithoutMicrophoneControl';
import RosterControl from './MeetingsJSONAdapter/controls/RosterControl';
import SettingsControl from './MeetingsJSONAdapter/controls/SettingsControl';
import ShareControl from './MeetingsJSONAdapter/controls/ShareControl';
import SwitchCameraControl from './MeetingsJSONAdapter/controls/SwitchCameraControl';
import SwitchMicrophoneControl from './MeetingsJSONAdapter/controls/SwitchMicrophoneControl';

// Meeting control names
export const DISABLED_MUTE_AUDIO_CONTROL = 'disabled-mute-audio';
export const DISABLED_JOIN_CONTROL = 'disabled-join-meeting';
export const JOIN_CONTROL = 'join-meeting';
export const LEAVE_CONTROL = 'leave-meeting';
export const MUTE_AUDIO_CONTROL = 'mute-audio';
export const MUTE_VIDEO_CONTROL = 'mute-video';
export const PROCEED_WITHOUT_CAMERA_CONTROL = 'proceed-without-camera';
export const PROCEED_WITHOUT_MICROPHONE_CONTROL = 'proceed-without-microphone';
export const ROSTER_CONTROL = 'member-roster';
export const SETTINGS_CONTROL = 'settings';
export const SHARE_CONTROL = 'share-screen';
export const SWITCH_CAMERA_CONTROL = 'switch-camera';
export const SWITCH_MICROPHONE_CONTROL = 'switch-microphone';

const EMPTY_MEETING = {
  ID: null,
  title: null,
  localAudio: null,
  localVideo: null,
  localShare: null,
  remoteAudio: null,
  remoteVideo: null,
  remoteShare: null,
  showRoster: null,
  showSettings: false,
  status: 'NOT_JOINED',
  cameraID: null,
  microphoneID: null,
};

// Adapter Events
const EVENT_MEETING_UPDATE = 'meeting:update';

// TODO: Figure out how to import JS Doc definitions and remove duplication.
/**
 * A video conference in Webex over WebRTC.
 *
 * @external Meeting
 * @see {@link https://github.com/webex/component-adapter-interfaces/blob/master/src/MeetingsAdapter.js#L20}
 * @see {@link https://webrtc.org}
 */

// TODO: Figure out how to import JS Doc definitions and remove duplication.
/**
 * Display options of a meeting control.
 *
 * @external MeetingControlDisplay
 * @see {@link https://github.com/webex/component-adapter-interfaces/blob/master/src/MeetingsAdapter.js#L58}
 */

/**
 * Settings that specify what kind of tracks should be included in a media stream.
 *
 * @external MediaStreamConstraints
 * @see MediaStream
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints}
 */

/**
 * @typedef MeetingsJSON
 * @param {object} datasource  An object that contains meetings keyed by ID
 * @example
 * {
 *   "meeting-1": {
 *     "ID": "meeting-1",
 *     "title": "Development Standup",
 *     "localAudio": {},
 *     "localVideo": {},
 *     "localShare": null,
 *     "remoteAudio": {},
 *     "remoteVideo": {},
 *     "remoteShare": {},
 *     "showSettings": false,
 *     "state": "JOINED",
 *   },
 *   "meeting-2": {
 *     "ID": "meeting-2",
 *     "title": "Sprint Demos",
 *     "localAudio": {},
 *     "localVideo": {},
 *     "localShare": {},
 *     "remoteAudio": {},
 *     "remoteVideo": {},
 *     "remoteShare": {},
 *     "showSettings": false,
 *     "state": "NOT_JOINED",
 *   }
 * }
 */

/**
 * `MeetingsJSONAdapter` is an implementation of the `MeetingsAdapter` interface.
 * This implementation utilizes a JSON object as its source of meeting data.
 *
 * @see {@link MeetingsJSON}
 * @implements {MeetingsAdapter}
 */
export default class MeetingsJSONAdapter extends MeetingsAdapter {
  constructor(datasource) {
    super(datasource);

    this.meetingControls = {
      [MUTE_AUDIO_CONTROL]: new MuteAudioControl(this, MUTE_AUDIO_CONTROL),
      [MUTE_VIDEO_CONTROL]: new MuteVideoControl(this, MUTE_VIDEO_CONTROL),
      [SHARE_CONTROL]: new ShareControl(this, SHARE_CONTROL),
      [JOIN_CONTROL]: new JoinControl(this, JOIN_CONTROL),
      [PROCEED_WITHOUT_CAMERA_CONTROL]:
        new ProceedWithoutCameraControl(this, PROCEED_WITHOUT_CAMERA_CONTROL),
      [PROCEED_WITHOUT_MICROPHONE_CONTROL]:
        new ProceedWithoutMicrophoneControl(this, PROCEED_WITHOUT_MICROPHONE_CONTROL),
      [LEAVE_CONTROL]: new LeaveControl(this, LEAVE_CONTROL),
      [DISABLED_MUTE_AUDIO_CONTROL]:
        new DisabledMuteAudioControl(this, DISABLED_MUTE_AUDIO_CONTROL),
      [DISABLED_JOIN_CONTROL]: new DisabledJoinControl(this, DISABLED_JOIN_CONTROL),
      [ROSTER_CONTROL]: new RosterControl(this, ROSTER_CONTROL),
      [SETTINGS_CONTROL]: new SettingsControl(this, SETTINGS_CONTROL),
      [SWITCH_CAMERA_CONTROL]: new SwitchCameraControl(this, SWITCH_CAMERA_CONTROL),
      [SWITCH_MICROPHONE_CONTROL]: new SwitchMicrophoneControl(this, SWITCH_MICROPHONE_CONTROL),
    };
  }

  /**
   * Creates a meeting for the given destination.
   * Returns an observable that emits a Meeting object with the data from the newly created meeting.
   * Observable completes after meeting is created and data is emitted.
   *
   * @param {string} destination  Virtual location where the meeting should take place
   * @returns {Observable.<Meeting>} Observable that emits data of the newly created meeting
   */
  createMeeting(destination) {
    return Observable.create((observer) => {
      if (destination) {
        observer.next({...EMPTY_MEETING, ID: destination});
        observer.next(this.datasource[destination]);
      } else {
        observer.error(new Error(`Could not create meeting at destination "${destination}"`));
      }

      observer.complete();
    });
  }

  /**
   * Returns an observable that emits data of a meeting of the given ID.
   * Observable will complete once the current user leaves the meeting.
   * The observable will emit whenever there is a change in the meeting.
   * Changes observed:
   * - Initial data request
   * - Screen hare/unshare
   * - Audio & video mute/unmute
   *
   * @param {string} ID  Id of the meeting to get
   * @returns {Observable.<Meeting>} Observable that emits data of the given ID
   */
  getMeeting(ID) {
    const getMeeting$ = Observable.create((observer) => {
      // A falsy ID signifies that the meeting was not yet created, or is invalid
      if (!ID) {
        observer.next({
          ID: null,
          title: null,
          localAudio: null,
          localVideo: null,
          localShare: null,
          remoteAudio: null,
          remoteVideo: null,
          remoteShare: null,
          showRoster: null,
          showSettings: false,
          state: null,
          cameraID: null,
          microphoneID: null,
          videoPermission: null,
          audioPermission: null,
        });
      } else if (this.fetchMeeting(ID)) {
        const meeting = this.fetchMeeting(ID);

        // Add a video stream as if it were a remote meeting
        if (meeting.remoteVideo instanceof MediaStream) {
          meeting.remoteVideo = this.getVideoStream();
        }

        // Add a share stream as if it were a remote sharing
        if (meeting.remoteShare instanceof MediaStream) {
          meeting.remoteShare = this.getShareStream();
        }

        observer.next(meeting);
      } else {
        observer.error(new Error(`Could not find meeting with ID "${ID}"`));
      }

      observer.complete();
    });

    // Send updates on the meeting when an action is triggered
    const meetingEvents$ = fromEvent(document, EVENT_MEETING_UPDATE).pipe(
      filter((event) => event.detail.ID === ID),
      // Make a copy of the meeting to treat it as if were immutable
      map((event) => ({...event.detail})),
    );

    return concat(getMeeting$, meetingEvents$).pipe(
      takeWhile((meeting) => meeting.state !== MeetingState.LEFT, true),
    );
  }

  /**
   * Joins the meeting by adding remote media streams.
   * Used by "join-meeting" meeting control.
   *
   * @param {string} ID  Id of the meeting for which to join
   */
  async joinMeeting(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      remoteVideo: await this.getStream({video: true, audio: false}),
      remoteAudio: await this.getStream({video: false, audio: true}),
      state: MeetingState.JOINED,
    }));
  }

  /**
   * Allows user to join the meeting without allowing camera access
   *
   * @param {string} ID  Id of the meeting for which to join
   */
  async ignoreVideoAccessPrompt(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      videoPermission: 'IGNORED',
    }));
  }

  /**
   * Allows user to join the meeting without allowing microphone access
   *
   * @param {string} ID  Id of the meeting for which to join
   */
  async ignoreAudioAccessPrompt(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      audioPermission: 'IGNORED',
    }));
  }

  /**
   * Leaves the meeting and removes the remote media streams.
   * Used by "leave-meeting" meeting control.
   *
   * @param {string} ID  Id of the meeting for which to leave
   */
  async leaveMeeting(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      remoteVideo: null,
      remoteAudio: null,
      state: MeetingState.LEFT,
    }));
  }

  /**
   * Returns a promise to a MediaStream object obtained from the user's browser.
   *
   * @param {MediaStreamConstraints} constraints  Object specifying media settings
   * @returns {Promise.<MediaStream>} Media stream that matches given constraints
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  async getStream(constraints) {
    let stream;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Filter out either video or audio from a given constraints and return a new media stream
      if (constraints.video) {
        stream = new MediaStream([mediaStream.getVideoTracks()[0]]);
      }

      if (constraints.audio) {
        stream = new MediaStream([mediaStream.getAudioTracks()[0]]);
      }
    } catch (reason) {
      // eslint-disable-next-line no-console
      console.error('Meetings JSON adapter can not display the local user stream', reason);
    }

    return stream;
  }

  /**
   * Returns a promise to a MediaStream object that captures the contents of a user display.
   *
   * @returns {Promise.<MediaStream>} Media stream that captures display
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  async getDisplayStream() {
    let captureStream = null;

    try {
      captureStream = await navigator.mediaDevices.getDisplayMedia();
    } catch (reason) {
      // eslint-disable-next-line no-console
      console.error('Meetings JSON adapter can not display the local user sharing stream', reason);
    }

    return captureStream;
  }

  /**
   * Returns available media devices.
   *
   * @param {'videoinput'|'audioinput'|'audiooutput'} type  String specifying the device type.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/kind|MDN}
   * @returns {MediaDeviceInfo[]|null} Array containing media devices or null if devices can't be read.
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  async getAvailableDevices(type) {
    let devices = null;

    try {
      devices = await navigator.mediaDevices.enumerateDevices();
      devices = devices.filter((device) => device.kind === type && device.deviceId);
    } catch (reason) {
      // eslint-disable-next-line no-console
      console.error('Meetings JSON adapter can not enumerate media devices', reason);
    }

    return devices;
  }

  /**
   * Returns a promise to a MediaStream object that captures the contents of a video.
   *
   * @returns {Promise.<MediaStream>} Media stream that captures display
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  getStreamFromElement(id) {
    const video = document.getElementById(id);
    let stream = new MediaStream();

    if (video && video.captureStream) {
      stream = video.captureStream();
    } else if (video && video.mozCaptureStream) {
      stream = video.mozCaptureStream();
    }

    return stream;
  }

  /**
   * Returns a promise to a MediaStream object that captures the contents of a video.
   *
   * @returns {Promise.<MediaStream>} Media stream that captures display
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  getVideoStream() {
    return this.getStreamFromElement('remote-video');
  }

  /**
   * Returns a promise to a MediaStream object that captures the contents of a screen share
   *
   * @returns {Promise.<MediaStream>} Media stream that captures display
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  getShareStream() {
    return this.getStreamFromElement('remote-share');
  }

  /**
   * Toggles muting the local audio media stream track.
   * Used by "mute-audio" meeting control.
   *
   * @param {string} ID  Id of the meeting for which to mute local audio
   */
  async toggleMuteAudio(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      localAudio: meeting.localAudio ? null : await this.getStream({video: false, audio: true}),
    }));
  }

  /**
   * Toggles muting the local audio media stream track.
   * Used by "mute-video" meeting control.
   *
   * @param {string} ID  Id of the meeting for which to mute local video
   */
  async toggleMuteVideo(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      localVideo: meeting.localVideo ? null : await this.getStream({video: true, audio: false}),
    }));
  }

  /**
   * Handles the starting and stopping of the local screen share.
   *
   * @param {string} ID  Id of the meeting for which to update display
   */
  async handleLocalShare(ID) {
    await this.updateMeeting(ID, async (meeting) => {
      const updatedMeeting = {...meeting};

      if (meeting.localShare) {
        updatedMeeting.localShare.getTracks()[0].stop();
        updatedMeeting.localShare = null;
      } else {
        updatedMeeting.localShare = await this.getDisplayStream();
        updatedMeeting.remoteShare = null;

        if (meeting.localShare) {
          // Handle browser's built-in stop Button
          updatedMeeting.localShare.getVideoTracks()[0].onended = () => {
            updatedMeeting.localShare = null;
          };
        }
      }

      return updatedMeeting;
    });
  }

  /**
   * Toggles the roster display flag of a meeting.
   *
   * @param {string} ID  Id of the meeting for which to update display
   */
  async toggleRoster(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      showRoster: !meeting.showRoster,
    }));
  }

  /**
   * Toggles the settings display flag of a meeting.
   *
   * @param {string} ID  Id of the meeting for which to toggle the settings flag
   */
  async toggleSettings(ID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      showSettings: !meeting.showSettings,
    }));
  }

  /**
   * Switches the camera control.
   *
   * @param {string} ID  Id of the meeting for which to switch camera
   * @param {string} cameraID  Id of the camera device to switch to
   */
  async switchCamera(ID, cameraID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      localVideo: await this.getStream({video: {deviceId: {exact: cameraID}}}),
      cameraID,
    }));
  }

  /**
   * Switches the microphone control.
   *
   * @param {string} ID  Id of the meeting for which to switch microphone
   * @param {string} microphoneID  Id of the microphone device to switch to
   * @private
   */
  async switchMicrophone(ID, microphoneID) {
    await this.updateMeeting(ID, async (meeting) => ({
      ...meeting,
      localAudio: await this.getStream({audio: {deviceId: {exact: microphoneID}}}),
      microphoneID,
    }));
  }

  /**
   * Returns a adapter meeting object retrieved from the collection.
   *
   * @private
   * @param {string} ID  Id of the meeting to fetch.
   * @returns {Meeting} The adapter meeting object from the meetings collection.
   */
  fetchMeeting(ID) {
    return this.datasource[ID];
  }

  /**
   * An async callback that returns an updated meeting
   *
   * @async
   * @callback UpdateMeetingCallback
   * @param {Meeting} meeting  Original meeting object
   * @returns {Promise<Meeting>} Updated meeting object
   */

  /**
   * Updates a meeting and notifies listeners
   *
   * @private
   * @async
   * @param {string} ID  Id of the meeting to fetch.
   * @param {UpdateMeetingCallback} updater  Function to update the meeting
   */
  async updateMeeting(ID, updater) {
    const meeting = this.fetchMeeting(ID);
    const updatedMeeting = await updater(meeting);

    // Copy the updated meeting object over the existing meeting object in the adapter
    for (const key of Object.keys(meeting)) {
      delete meeting[key];
    }

    Object.assign(meeting, updatedMeeting);

    document.dispatchEvent(new CustomEvent(EVENT_MEETING_UPDATE, {detail: meeting}));
  }
}
