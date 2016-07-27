import {ElementRef, EventEmitter, Injectable} from '@angular/core';
import * as hammer from 'hammerjs';

import {DisableScroll, GestureController, GestureDelegate, GesturePriority} from '../gesture-controller';
import {GestureDirection} from './gesture-direction';
import {CaptureError, GestureRecognizer} from './gesture-recognizer';

const DEFAULT_THRESHOLD: number = 1;

export class PanGestureRecognizer extends GestureRecognizer {

  public onPanStart = new EventEmitter<HammerInput>();
  public onPanMove = new EventEmitter<HammerInput>();
  public onPanEnd = new EventEmitter<HammerInput>();
  public onPanCancel = new EventEmitter<HammerInput>();

  private _onPanStartHandler = (event: HammerInput) => {
    this.onPanStartHandler(event);
  }

  private _onPanMoveHandler = (event: HammerInput) => {
    this.onPanMoveHandler(event);
  }

  private _onPanEndHandler = (event: HammerInput) => {
    this.onPanEndHandler(event);
  }

  private _onPanCancelHandler = (event: HammerInput) => {
    this.onPanCancelHandler(event);
  }

  constructor(delegate: GestureDelegate, elementRef: ElementRef, options: PanGestureRecognizerOptions) {
    super(delegate, hammer.Pan, options, elementRef);
  }

  listen() {
    super.listen();
    this.hammerManager.on('panstart', this._onPanStartHandler);
    this.hammerManager.on('panmove', this._onPanMoveHandler);
    this.hammerManager.on('panend', this._onPanEndHandler);
    this.hammerManager.on('pancancel', this._onPanCancelHandler);
  }

  unlisten() {
    super.unlisten();
    this.hammerManager.off('panstart', this._onPanStartHandler);
    this.hammerManager.off('panmove', this._onPanMoveHandler);
    this.hammerManager.off('panend', this._onPanEndHandler);
    this.hammerManager.off('pancancel', this._onPanCancelHandler);
  }

  onPanStartHandler(event: HammerInput) {
    try {
      if ( this.started ) {
        throw new Error("Already started");
      }

      if ( ! this.delegate ) {
        throw new Error("Delegate missing");
      }

      if ( this.captured ) {
        throw new Error('Already captured');
      }

      // release any existing gesture
      this.delegate.release();

      // try to start the gesture
      this.started = this.delegate.start();
      if ( ! this.started ){
        throw new Error('Failed to start');
      }

      this.captured = this.delegate.capture();

      if ( ! this.captured ){
        throw new CaptureError("Failed to capture");
      }

      this.onPanStart.emit(event);
    }
    catch (ex) {
      console.debug(`onPanStartHandler: Error occured - ${ex.message}`);
      if ( ex instanceof CaptureError ) {
        this.started = false;
        this.captured = false;
      }
    }
  }

  onPanMoveHandler(event: HammerInput) {
    try {
      if ( ! this.started ) {
        throw new Error('Not started');
      }

      if ( ! this.captured ) {
        throw new Error('Not captured');
      }

      this.onPanMove.emit(event);
    }
    catch (ex) {
      console.debug(`onPanMoveHandler: Error occured - ${ex.message}`);
    }
  }

  onPanEndHandler(event: HammerInput) {
    try {
      if ( ! this.started ) {
        throw new Error('Not started');
      }

      if ( ! this.captured ) {
        throw new Error('Not captured');
      }

      this.onPanEnd.emit(event);
    }
    catch (ex) {
      console.debug(`onPanEndHandler: Error occured - ${ex.message}`);
    }
    finally {
      if ( this.delegate ) {
        this.delegate.release();
      }
      this.started = false;
      this.captured = false;
    }
  }

  onPanCancelHandler(event: HammerInput) {
    try {
      this.onPanCancel.emit(event);
    }
    catch (ex) {
      console.debug(`onPanCancelHandler: Error occured - ${ex.message}`);
    }
    finally {
      if ( this.delegate ) {
        this.delegate.release();
      }
      this.started = false;
      this.captured = false;
    }
  }
}

export interface PanGestureRecognizerOptions {
  threshold?: number,
  pointers?: number,
  direction?: GestureDirection,
  priority?: GesturePriority,
  disableScroll? : DisableScroll
}

@Injectable()
export class PanGestureRecognizerProvider{
  constructor(private gestureController: GestureController) {
  }

  create(elementRef:ElementRef, options: PanGestureRecognizerOptions) {
    // assign reasonable defaults
    options.direction = !!options.direction ? options.direction : GestureDirection.ALL;
    options.threshold = !!options.threshold ? options.threshold : DEFAULT_THRESHOLD;
    options.pointers = !!options.pointers ? options.pointers : 1;
    options.priority = !!options.priority ? options.priority : GesturePriority.Normal;
    options.disableScroll = !!options.disableScroll ? options.disableScroll : DisableScroll.DuringCapture;

    let delegate = this.gestureController.create(`pan-gesture-#${++count}`, {
      priority: options.priority,
      disableScroll: options.disableScroll
    });

    return new PanGestureRecognizer(delegate, elementRef, options);
  }
}

let count = 0;