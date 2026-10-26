import { Platform } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import { InAppUpdateManagerService } from '../src/services/update/InAppUpdateManager';

describe('InAppUpdateManager - Deep Test Suite', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  afterAll(() => {
    Platform.OS = originalOS;
  });

  it('returns shouldUpdate = false when store has no new version', async () => {
    const manager = new InAppUpdateManagerService();
    const result = await manager.checkForUpdate();
    expect(result.shouldUpdate).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it('detects available update and returns storeVersion', async () => {
    const mockCheckNeedsUpdate = jest.fn().mockResolvedValue({
      shouldUpdate: true,
      storeVersion: '1.2.0',
    });
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: mockCheckNeedsUpdate,
      startUpdate: jest.fn().mockResolvedValue(undefined),
    }));

    const manager = new InAppUpdateManagerService();
    const result = await manager.checkForUpdate();
    expect(result.shouldUpdate).toBe(true);
    expect(result.storeVersion).toBe('1.2.0');
  });

  it('handles network or Play Store errors gracefully without throwing', async () => {
    const mockCheckNeedsUpdate = jest.fn().mockRejectedValue(new Error('Network error / Play Store unreachable'));
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: mockCheckNeedsUpdate,
      startUpdate: jest.fn(),
    }));

    const manager = new InAppUpdateManagerService();
    const result = await manager.checkForUpdate();
    expect(result.shouldUpdate).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('handles non-Error thrown exceptions safely', async () => {
    const mockCheckNeedsUpdate = jest.fn().mockRejectedValue('Unknown string rejection');
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: mockCheckNeedsUpdate,
      startUpdate: jest.fn(),
    }));

    const manager = new InAppUpdateManagerService();
    const result = await manager.checkForUpdate();
    expect(result.shouldUpdate).toBe(false);
    expect(result.error).toBe('Unknown string rejection');
  });

  it('triggers flexible update (IAUUpdateKind.FLEXIBLE) on Android when forceUpdate is false', async () => {
    const selectSpy = jest.spyOn(Platform, 'select').mockImplementation((obj: any) => obj.android ?? obj.default);
    const mockStartUpdate = jest.fn().mockResolvedValue(undefined);
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: true }),
      startUpdate: mockStartUpdate,
    }));

    const manager = new InAppUpdateManagerService();
    const success = await manager.startUpdate(false);
    expect(success).toBe(true);
    expect(mockStartUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ updateType: IAUUpdateKind.FLEXIBLE })
    );
    selectSpy.mockRestore();
  });

  it('triggers immediate update (IAUUpdateKind.IMMEDIATE) on Android when forceUpdate is true', async () => {
    const selectSpy = jest.spyOn(Platform, 'select').mockImplementation((obj: any) => obj.android ?? obj.default);
    const mockStartUpdate = jest.fn().mockResolvedValue(undefined);
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: true }),
      startUpdate: mockStartUpdate,
    }));

    const manager = new InAppUpdateManagerService();
    const success = await manager.startUpdate(true);
    expect(success).toBe(true);
    expect(mockStartUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ updateType: IAUUpdateKind.IMMEDIATE })
    );
    selectSpy.mockRestore();
  });

  it('passes empty options on iOS', async () => {
    const selectSpy = jest.spyOn(Platform, 'select').mockImplementation((obj: any) => obj.ios ?? obj.default);
    const mockStartUpdate = jest.fn().mockResolvedValue(undefined);
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: true }),
      startUpdate: mockStartUpdate,
    }));

    const manager = new InAppUpdateManagerService();
    const success = await manager.startUpdate(false);
    expect(success).toBe(true);
    expect(mockStartUpdate).toHaveBeenCalledWith({});
    selectSpy.mockRestore();
  });

  it('returns false and catches errors if startUpdate fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mockStartUpdate = jest.fn().mockRejectedValue(new Error('User cancelled or Play Core failure'));
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: true }),
      startUpdate: mockStartUpdate,
    }));

    const manager = new InAppUpdateManagerService();
    const success = await manager.startUpdate(false);
    expect(success).toBe(false);
    warnSpy.mockRestore();
  });

  it('checkAndPrompt triggers update automatically if update is available', async () => {
    const mockStartUpdate = jest.fn().mockResolvedValue(undefined);
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: true }),
      startUpdate: mockStartUpdate,
    }));

    const manager = new InAppUpdateManagerService();
    const result = await manager.checkAndPrompt(false);
    expect(result).toBe(true);
    expect(mockStartUpdate).toHaveBeenCalled();
  });

  it('checkAndPrompt does nothing if no update is needed', async () => {
    const mockStartUpdate = jest.fn();
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => ({
      checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: false }),
      startUpdate: mockStartUpdate,
    }));

    const manager = new InAppUpdateManagerService();
    const result = await manager.checkAndPrompt(false);
    expect(result).toBe(false);
    expect(mockStartUpdate).not.toHaveBeenCalled();
  });

  it('handles initialization failure gracefully', async () => {
    (SpInAppUpdates as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Native module missing');
    });

    const manager = new InAppUpdateManagerService();
    const checkResult = await manager.checkForUpdate();
    expect(checkResult.shouldUpdate).toBe(false);
    expect(checkResult.error).toBe('InAppUpdates not initialized');

    const startResult = await manager.startUpdate();
    expect(startResult).toBe(false);
  });
});
