/**
 * Auto-generated preference mappings from classification.json
 * Generated at: 2026-09-02T12:29:18.063Z
 *
 * This file contains pure mapping relationships without default values.
 * Default values are managed in src/shared/data/preferences.ts
 *
 * === AUTO-GENERATED CONTENT START ===
 */

/**
 * ElectronStore映射关系 - 简单一层结构
 *
 * ElectronStore没有嵌套，originalKey直接对应configManager.get(key)
 */
export const ELECTRON_STORE_MAPPINGS = [
  {
    originalKey: 'ZoomFactor',
    targetKey: 'app.zoom_factor'
  },
  {
    originalKey: 'clientId',
    targetKey: 'app.user.id'
  }
] as const

/**
 * Redux Store映射关系 - 按category分组，支持嵌套路径
 *
 * Redux Store可能有children结构，originalKey可能包含嵌套路径:
 * - 直接字段: "theme" -> reduxData.settings.theme
 * - 嵌套字段: "codeEditor.enabled" -> reduxData.settings.codeEditor.enabled
 * - 多层嵌套: "exportMenuOptions.docx" -> reduxData.settings.exportMenuOptions.docx
 */
export const REDUX_STORE_MAPPINGS = {
  settings: [
    {
      originalKey: 'language',
      targetKey: 'app.language'
    },
    {
      originalKey: 'theme',
      targetKey: 'ui.theme_mode'
    },
    {
      originalKey: 'launchToTray',
      targetKey: 'app.tray.on_launch'
    },
    {
      originalKey: 'tray',
      targetKey: 'app.tray.enabled'
    },
    {
      originalKey: 'trayOnClose',
      targetKey: 'app.tray.on_close'
    },
    {
      originalKey: 'clickTrayToShowQuickAssistant',
      targetKey: 'feature.quick_assistant.click_tray_to_show'
    },
    {
      originalKey: 'enableQuickAssistant',
      targetKey: 'feature.quick_assistant.enabled'
    },
    {
      originalKey: 'autoCheckUpdate',
      targetKey: 'app.dist.auto_update.enabled'
    },
    {
      originalKey: 'testPlan',
      targetKey: 'app.dist.test_plan.enabled'
    },
    {
      originalKey: 'testChannel',
      targetKey: 'app.dist.test_plan.channel'
    },
    {
      originalKey: 'enableDataCollection',
      targetKey: 'app.privacy.data_collection.enabled'
    },
    {
      originalKey: 'enableDeveloperMode',
      targetKey: 'app.developer_mode.enabled'
    },
    {
      originalKey: 'showTopics',
      targetKey: 'topic.tab.show'
    },
    {
      originalKey: 'assistantsTabSortType',
      targetKey: 'assistant.tab.sort_type'
    },
    {
      originalKey: 'sendMessageShortcut',
      targetKey: 'chat.input.send_message_shortcut'
    },
    {
      originalKey: 'targetLanguage',
      targetKey: 'chat.input.translate.target_language'
    },
    {
      originalKey: 'proxyMode',
      targetKey: 'app.proxy.mode'
    },
    {
      originalKey: 'proxyUrl',
      targetKey: 'app.proxy.url'
    },
    {
      originalKey: 'proxyBypassRules',
      targetKey: 'app.proxy.bypass_rules'
    },
    {
      originalKey: 'userName',
      targetKey: 'app.user.name'
    },
    {
      originalKey: 'showMessageDivider',
      targetKey: 'chat.message.show_divider'
    },
    {
      originalKey: 'messageFont',
      targetKey: 'chat.message.font'
    },
    {
      originalKey: 'showInputEstimatedTokens',
      targetKey: 'chat.input.show_estimated_tokens'
    },
    {
      originalKey: 'launchOnBoot',
      targetKey: 'app.launch_on_boot'
    },
    {
      originalKey: 'userTheme.colorPrimary',
      targetKey: 'ui.theme_user.color_primary'
    },
    {
      originalKey: 'userTheme.userFontFamily',
      targetKey: 'ui.theme_user.font_family'
    },
    {
      originalKey: 'userTheme.userCodeFontFamily',
      targetKey: 'ui.theme_user.code_font_family'
    },
    {
      originalKey: 'windowStyle',
      targetKey: 'ui.window_style'
    },
    {
      originalKey: 'fontSize',
      targetKey: 'chat.message.font_size'
    },
    {
      originalKey: 'topicPosition',
      targetKey: 'topic.tab.position'
    },
    {
      originalKey: 'assistantIconType',
      targetKey: 'assistant.icon_type'
    },
    {
      originalKey: 'pasteLongTextAsFile',
      targetKey: 'chat.input.paste_long_text_as_file'
    },
    {
      originalKey: 'pasteLongTextThreshold',
      targetKey: 'chat.input.paste_long_text_threshold'
    },
    {
      originalKey: 'renderInputMessageAsMarkdown',
      targetKey: 'chat.message.render_as_markdown'
    },
    {
      originalKey: 'codeExecution.enabled',
      targetKey: 'chat.code.execution.enabled'
    },
    {
      originalKey: 'codeExecution.timeoutMinutes',
      targetKey: 'chat.code.execution.timeout_minutes'
    },
    {
      originalKey: 'codeEditor.enabled',
      targetKey: 'chat.code.editor.enabled'
    },
    {
      originalKey: 'codeEditor.themeLight',
      targetKey: 'chat.code.editor.theme_light'
    },
    {
      originalKey: 'codeEditor.themeDark',
      targetKey: 'chat.code.editor.theme_dark'
    },
    {
      originalKey: 'codeEditor.highlightActiveLine',
      targetKey: 'chat.code.editor.highlight_active_line'
    },
    {
      originalKey: 'codeEditor.foldGutter',
      targetKey: 'chat.code.editor.fold_gutter'
    },
    {
      originalKey: 'codeEditor.autocompletion',
      targetKey: 'chat.code.editor.autocompletion'
    },
    {
      originalKey: 'codeEditor.keymap',
      targetKey: 'chat.code.editor.keymap'
    },
    {
      originalKey: 'codePreview.themeLight',
      targetKey: 'chat.code.preview.theme_light'
    },
    {
      originalKey: 'codePreview.themeDark',
      targetKey: 'chat.code.preview.theme_dark'
    },
    {
      originalKey: 'codeViewer.themeLight',
      targetKey: 'chat.code.viewer.theme_light'
    },
    {
      originalKey: 'codeViewer.themeDark',
      targetKey: 'chat.code.viewer.theme_dark'
    },
    {
      originalKey: 'codeShowLineNumbers',
      targetKey: 'chat.code.show_line_numbers'
    },
    {
      originalKey: 'codeCollapsible',
      targetKey: 'chat.code.collapsible'
    },
    {
      originalKey: 'codeWrappable',
      targetKey: 'chat.code.wrappable'
    },
    {
      originalKey: 'codeImageTools',
      targetKey: 'chat.code.image_tools'
    },
    {
      originalKey: 'codeFancyBlock',
      targetKey: 'chat.code.fancy_block'
    },
    {
      originalKey: 'mathEnableSingleDollar',
      targetKey: 'chat.message.math.single_dollar'
    },
    {
      originalKey: 'messageStyle',
      targetKey: 'chat.message.style'
    },
    {
      originalKey: 'foldDisplayMode',
      targetKey: 'chat.message.multi_model.fold_display_mode'
    },
    {
      originalKey: 'gridColumns',
      targetKey: 'chat.message.multi_model.grid_columns'
    },
    {
      originalKey: 'gridPopoverTrigger',
      targetKey: 'chat.message.multi_model.grid_popover_trigger'
    },
    {
      originalKey: 'messageNavigation',
      targetKey: 'chat.message.navigation_mode'
    },
    {
      originalKey: 'skipBackupFile',
      targetKey: 'data.backup.general.skip_backup_file'
    },
    {
      originalKey: 'translateModelPrompt',
      targetKey: 'feature.translate.model_prompt'
    },
    {
      originalKey: 'autoTranslateWithSpace',
      targetKey: 'chat.input.translate.auto_translate_with_space'
    },
    {
      originalKey: 'showTranslateConfirm',
      targetKey: 'chat.input.translate.show_confirm'
    },
    {
      originalKey: 'enableTopicNaming',
      targetKey: 'topic.naming.enabled'
    },
    {
      originalKey: 'topicNamingPrompt',
      targetKey: 'topic.naming_prompt'
    },
    {
      originalKey: 'confirmDeleteMessage',
      targetKey: 'chat.message.confirm_delete'
    },
    {
      originalKey: 'confirmRegenerateMessage',
      targetKey: 'chat.message.confirm_regenerate'
    },
    {
      originalKey: 'narrowMode',
      targetKey: 'chat.narrow_mode'
    },
    {
      originalKey: 'multiModelMessageStyle',
      targetKey: 'chat.message.multi_model.style'
    },
    {
      originalKey: 'readClipboardAtStartup',
      targetKey: 'feature.quick_assistant.read_clipboard_at_startup'
    },
    {
      originalKey: 'markdownExportPath',
      targetKey: 'data.export.markdown.path'
    },
    {
      originalKey: 'forceDollarMathInMarkdown',
      targetKey: 'data.export.markdown.force_dollar_math'
    },
    {
      originalKey: 'useTopicNamingForMessageTitle',
      targetKey: 'data.export.markdown.use_topic_naming_for_message_title'
    },
    {
      originalKey: 'showModelNameInMarkdown',
      targetKey: 'data.export.markdown.show_model_name'
    },
    {
      originalKey: 'showModelProviderInMarkdown',
      targetKey: 'data.export.markdown.show_model_provider'
    },
    {
      originalKey: 'thoughtAutoCollapse',
      targetKey: 'chat.message.thought.auto_collapse'
    },
    {
      originalKey: 'excludeCitationsInExport',
      targetKey: 'data.export.markdown.exclude_citations'
    },
    {
      originalKey: 'standardizeCitationsInExport',
      targetKey: 'data.export.markdown.standardize_citations'
    },
    {
      originalKey: 'privacyPolicyVersion',
      targetKey: 'app.privacy.policy_version'
    },
    {
      originalKey: 'enableSpellCheck',
      targetKey: 'app.spell_check.enabled'
    },
    {
      originalKey: 'spellCheckLanguages',
      targetKey: 'app.spell_check.languages'
    },
    {
      originalKey: 'useSystemTitleBar',
      targetKey: 'app.use_system_title_bar'
    },
    {
      originalKey: 'exportMenuOptions.image',
      targetKey: 'data.export.menus.image'
    },
    {
      originalKey: 'exportMenuOptions.markdown',
      targetKey: 'data.export.menus.markdown'
    },
    {
      originalKey: 'exportMenuOptions.markdown_reason',
      targetKey: 'data.export.menus.markdown_reason'
    },
    {
      originalKey: 'exportMenuOptions.docx',
      targetKey: 'data.export.menus.docx'
    },
    {
      originalKey: 'exportMenuOptions.plain_text',
      targetKey: 'data.export.menus.plain_text'
    },
    {
      originalKey: 'notification.assistant',
      targetKey: 'app.notification.assistant.enabled'
    },
    {
      originalKey: 'notification.backup',
      targetKey: 'app.notification.backup.enabled'
    },
    {
      originalKey: 'notification.knowledge',
      targetKey: 'app.notification.knowledge.enabled'
    },
    {
      originalKey: 'localBackupDir',
      targetKey: 'data.backup.local.dir'
    },
    {
      originalKey: 'localBackupAutoSync',
      targetKey: 'data.backup.local.auto_sync'
    },
    {
      originalKey: 'localBackupSyncInterval',
      targetKey: 'data.backup.local.sync_interval'
    },
    {
      originalKey: 'localBackupMaxBackups',
      targetKey: 'data.backup.local.max_backups'
    },
    {
      originalKey: 'localBackupSkipBackupFile',
      targetKey: 'data.backup.local.skip_backup_file'
    },
    {
      originalKey: 'navbarPosition',
      targetKey: 'ui.navbar.position'
    },
    {
      originalKey: 'apiServer.enabled',
      targetKey: 'feature.api_gateway.enabled'
    },
    {
      originalKey: 'apiServer.host',
      targetKey: 'feature.api_gateway.host'
    },
    {
      originalKey: 'apiServer.port',
      targetKey: 'feature.api_gateway.port'
    },
    {
      originalKey: 'apiServer.apiKey',
      targetKey: 'feature.api_gateway.api_key'
    },
    {
      originalKey: 'showMessageOutline',
      targetKey: 'chat.message.show_outline'
    }
  ],
  selectionStore: [
    {
      originalKey: 'selectionEnabled',
      targetKey: 'feature.selection.enabled'
    },
    {
      originalKey: 'triggerMode',
      targetKey: 'feature.selection.trigger_mode'
    },
    {
      originalKey: 'isFollowToolbar',
      targetKey: 'feature.selection.follow_toolbar'
    },
    {
      originalKey: 'isRemeberWinSize',
      targetKey: 'feature.selection.remember_win_size'
    },
    {
      originalKey: 'filterMode',
      targetKey: 'feature.selection.filter_mode'
    },
    {
      originalKey: 'filterList',
      targetKey: 'feature.selection.filter_list'
    },
    {
      originalKey: 'isCompact',
      targetKey: 'feature.selection.compact'
    },
    {
      originalKey: 'isAutoClose',
      targetKey: 'feature.selection.auto_close'
    },
    {
      originalKey: 'isAutoPin',
      targetKey: 'feature.selection.auto_pin'
    },
    {
      originalKey: 'actionWindowOpacity',
      targetKey: 'feature.selection.action_window_opacity'
    },
    {
      originalKey: 'actionItems',
      targetKey: 'feature.selection.action_items'
    }
  ],
  llm: [
    {
      originalKey: 'quickAssistantId',
      targetKey: 'feature.quick_assistant.assistant_id'
    }
  ],
  preprocess: [
    {
      originalKey: 'defaultProvider',
      targetKey: 'feature.file_processing.default_document_to_markdown'
    }
  ],
  translate: [
    {
      originalKey: 'settings.autoCopy',
      targetKey: 'feature.translate.page.auto_copy'
    }
  ],
  ocr: [
    {
      originalKey: 'imageProviderId',
      targetKey: 'feature.file_processing.default_image_to_text'
    }
  ]
} as const

/**
 * Dexie Settings映射关系 - 简单KV结构
 *
 * Maps Dexie IndexedDB `settings` table keys (id field) to new preference target keys.
 * The settings table uses a simple KV structure: { id: string, value: any }.
 *
 * These are simple 1:1 mappings where the value can be used as-is.
 * For complex transformations (value conversion, multi-key merging, etc.),
 * use ComplexPreferenceMappings with source: 'dexie-settings' instead.
 */
export const DEXIE_SETTINGS_MAPPINGS: ReadonlyArray<{ originalKey: string; targetKey: string }> = [
  {
    originalKey: 'translate:detect:method',
    targetKey: 'feature.translate.auto_detection_method'
  },
  {
    originalKey: 'image://avatar',
    targetKey: 'app.user.avatar'
  },
  {
    originalKey: 'translate:markdown:enabled',
    targetKey: 'feature.translate.page.enable_markdown'
  },
  {
    originalKey: 'translate:scroll:sync',
    targetKey: 'feature.translate.page.scroll_sync'
  },
  {
    originalKey: 'translate:bidirectional:enabled',
    targetKey: 'feature.translate.page.bidirectional_enabled'
  }
] as const

/**
 * localStorage映射关系 - 简单KV结构
 *
 * Maps browser localStorage keys to new preference target keys.
 * localStorage stores various UI state and provider tokens.
 *
 * These are simple 1:1 mappings where the value can be used as-is.
 * For complex transformations (pattern-based keys, value conversion),
 * use ComplexPreferenceMappings with source: 'localStorage' instead.
 */
export const LOCALSTORAGE_MAPPINGS: ReadonlyArray<{ originalKey: string; targetKey: string }> = [] as const

// === AUTO-GENERATED CONTENT END ===

/**
 * 映射统计:
 * - ElectronStore项: 2
 * - Redux Store项: 115
 * - Redux分类: settings, selectionStore, llm, preprocess, translate, ocr
 * - DexieSettings项: 5
 * - localStorage项: 0
 * - 总配置项: 122
 *
 * 使用说明:
 * 1. ElectronStore读取: configManager.get(mapping.originalKey)
 * 2. Redux读取: 需要解析嵌套路径 reduxData[category][originalKey路径]
 * 3. DexieSettings读取: ctx.sources.dexieSettings.get(mapping.originalKey)
 * 4. 默认值: 从defaultPreferences.default[mapping.targetKey]获取
 */
