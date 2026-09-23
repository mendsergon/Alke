import { IOSConfig, withXcodeProject, type ConfigPlugin } from '@expo/config-plugins';

/**
 * Puts `ios.deploymentTarget` on the project-level build configurations too.
 *
 * Expo's own plugin only reaches the app target:
 * `@expo/config-plugins@57.0.9/build/ios/DeploymentTarget.js` →
 * `updateDeploymentTargetForPbxproj` resolves `findFirstNativeTarget` and
 * writes `IPHONEOS_DEPLOYMENT_TARGET` into that target's configurations alone.
 * The PBXProject's own pair keeps whatever the template shipped — 16.4 — so a
 * clean prebuild leaves two of the four entries below our floor.
 *
 * The app inherits the target's value, so the binary is correct either way
 * (`MinimumOSVersion 26.0`). What this fixes is the trap: anything added to
 * the project later that does not override the setting — a second target, an
 * app extension — would silently inherit 16.4.
 *
 * The value is read from the Expo config rather than written here, so there is
 * one place the floor is stated: `ios.deploymentTarget` in `app.config.ts`.
 */
const withProjectDeploymentTarget: ConfigPlugin = (config) => {
  return withXcodeProject(config, (cfg) => {
    const deploymentTarget = cfg.ios?.deploymentTarget;
    if (!deploymentTarget) {
      throw new Error(
        'with-project-deployment-target: ios.deploymentTarget is not set in app.config.ts. ' +
          'Set it there rather than writing a version into this plugin.',
      );
    }

    const project = cfg.modResults;

    // The PBXProject holds the configurations every target inherits from.
    const projectSection = IOSConfig.XcodeUtils.getProjectSection(project);
    const projects = Object.entries(projectSection).filter(IOSConfig.XcodeUtils.isNotComment);
    if (projects.length === 0) {
      throw new Error('with-project-deployment-target: no PBXProject in the Xcode project.');
    }

    let written = 0;
    for (const [, pbxProject] of projects) {
      const listId = (pbxProject as { buildConfigurationList: string }).buildConfigurationList;
      const configurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(project, listId);
      if (configurations.length === 0) {
        throw new Error(
          `with-project-deployment-target: configuration list ${listId} holds no build configurations.`,
        );
      }
      for (const [, buildConfig] of configurations) {
        buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
        written += 1;
      }
    }

    if (written === 0) {
      throw new Error(
        'with-project-deployment-target: wrote no deployment target. The Xcode project no longer ' +
          'looks the way this plugin expects; fix the plugin rather than letting the floor drift.',
      );
    }

    return cfg;
  });
};

export default withProjectDeploymentTarget;
