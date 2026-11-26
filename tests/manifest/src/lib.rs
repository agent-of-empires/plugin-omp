#[cfg(test)]
mod tests {
    use aoe_plugin_api::{
        agent_integration::{
            AgentCaptureBackend, AgentCaptureContext, AgentDetectionMode, AgentResumeDeclaration,
            AgentYoloDeclaration,
        },
        ManifestError, PluginManifest,
    };

    /// The pinned host accepts API 26, so the shipped manifest must validate cleanly there.
    #[test]
    fn manifest_matches_omp_agent_contract() {
        let manifest: PluginManifest = toml::from_str(include_str!("../../../aoe-plugin.toml"))
            .expect("plugin manifest must parse against the pinned AoE schema");
        if let Err(error) = manifest.validate() {
            panic!("the manifest must validate against the pinned API 26 host: {error:?}");
        }
        assert_eq!(manifest.api_version, 26);
        assert_eq!(manifest.version, "0.6.0");
        let mut api20 = manifest.clone();
        api20.api_version = 20;
        match api20.validate() {
            Err(ManifestError::Invalid(errors)) => assert!(
                errors.iter().any(|error| error.contains("declarations require api_version >= 21")),
                "{errors:?}"
            ),
            result => panic!("expected API 20 declarations to be rejected: {result:?}"),
        }
        let mut api25 = manifest.clone();
        api25.api_version = 25;
        match api25.validate() {
            Err(ManifestError::Invalid(errors)) => assert!(
                errors.iter().any(|error| error
                    .contains("launch.capture.backend = \"extension_sidecar\" requires api_version >= 26")),
                "{errors:?}"
            ),
            result => panic!("expected API 25 to reject the sidecar capture backend: {result:?}"),
        }
        assert!(manifest
            .capabilities
            .iter()
            .any(|cap| cap.as_str() == "session.integration"));
        let [integration] = manifest.agent_integrations.as_slice() else {
            panic!("expected one integration")
        };
        assert_eq!(integration.tool, "omp");
        assert_eq!(integration.command.as_deref(), Some("omp"));
        assert!(integration.replies);
        for version in [
            "18.10.4",
            "18.11.1",
            "18.11.2",
            "18.11.3",
            "18.16.0",
            "18.17.0",
            "18.99.99",
            "19.0.0",
            "19.0.1",
            "19.99.99",
        ] {
            assert!(integration.provider_compat(version).is_ok(), "{version}");
        }
        for version in ["18.10.3", "20.0.0", "19.0.1-rc.1", "18.17.0-rc.1", "invalid"] {
            assert!(integration.provider_compat(version).is_err(), "{version}");
        }
        let launch = integration.launch.as_ref().expect("launch");
        assert_eq!(launch.oneshot_flag.as_deref(), Some("-p"));
        assert_eq!(
            launch.instruction_flag.as_deref(),
            Some("--append-system-prompt {}")
        );
        assert_eq!(launch.model_flag.as_deref(), Some("--model"));
        assert_eq!(
            launch.install_hint.as_deref(),
            Some("curl -fsSL https://omp.sh/install | sh")
        );
        assert_eq!(
            launch
                .container_env
                .get("PI_CODING_AGENT_DIR")
                .map(String::as_str),
            Some("/root/.omp/agent")
        );
        assert_eq!(
            launch.yolo,
            Some(AgentYoloDeclaration::Flag {
                flag: "--auto-approve".into()
            })
        );
        assert_eq!(
            launch.resume,
            Some(AgentResumeDeclaration::Flag {
                flag: "--resume".into()
            })
        );
        let capture = launch.capture.as_ref().expect("capture");
        assert_eq!(capture.backend, AgentCaptureBackend::ExtensionSidecar);
        assert_eq!(capture.host, AgentCaptureContext::PaneScoped);
        assert_eq!(capture.sandbox, AgentCaptureContext::PaneScoped);
        assert_eq!(
            integration.detection.as_ref().map(|d| d.mode),
            Some(AgentDetectionMode::NativeOnly)
        );
        assert!(integration.reply_fallback.is_none());
    }
}
