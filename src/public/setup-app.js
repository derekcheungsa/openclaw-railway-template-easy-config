// Served at /setup/app.js
// Multi-step setup wizard with state management and validation
(function () {
  'use strict';

  // ===================================
  // State Management
  // ===================================
  var state = {
    currentStep: 1,
    totalSteps: 5,
    isConfigured: false,
    authGroups: [],
    atlasModels: [],
    openrouterModels: [],
    pairingRefreshTimer: null,
    modelscopeModels: [],
    formData: {
      authGroup: '',
      authChoice: '',
      authSecret: '',
      flow: 'quickstart',
      atlasModel: 'deepseek-ai/deepseek-v3.2',
      openrouterModel: 'anthropic/claude-sonnet-4',
      modelscopeModel: 'deepseek-ai/DeepSeek-V3.2',
      telegramToken: '',
      discordToken: '',
      slackBotToken: '',
      slackAppToken: ''
    }
  };

  // DOM Elements
  var els = {
    stepperItems: null,
    stepContents: null,
    navBack: null,
    navNext: null,
    authGroup: null,
    authChoice: null,
    authSecret: null,
    authSecretToggle: null,
    flow: null,
    atlasModelGroup: null,
    atlasModel: null,
    atlasModelInfo: null,
    atlasModelName: null,
    atlasModelDesc: null,
    atlasModelContext: null,
    atlasModelInput: null,
    atlasModelOutput: null,
    openrouterModelGroup: null,
    openrouterModel: null,
    openrouterModelInfo: null,
    openrouterModelName: null,
    openrouterModelDesc: null,
    openrouterModelContext: null,
    openrouterModelInput: null,
    openrouterModelOutput: null,
    modelscopeModelGroup: null,
    modelscopeModel: null,
    modelscopeModelInfo: null,
    modelscopeModelName: null,
    modelscopeModelDesc: null,
    modelscopeModelContext: null,
    modelscopeModelInput: null,
    modelscopeModelOutput: null,
    telegramToken: null,
    discordToken: null,
    slackBotToken: null,
    slackAppToken: null,
    confirmSetup: null,
    log: null,
    errorLog: null,
    progressFill: null,
    progressText: null,
    progressContainer: null,
    successContainer: null,
    errorContainer: null,
    configuredBanner: null,
    statusText: null,
    step1Next: null,
    accordionHeaders: null
  };

  // ===================================
  // Utility Functions
  // ===================================
  function $(selector) {
    return document.querySelector(selector);
  }

  function showElement(el) {
    if (el) el.hidden = false;
  }

  function hideElement(el) {
    if (el) el.hidden = true;
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function maskToken(token) {
    if (!token) return 'Not set';
    if (token.length <= 8) return '••••••••';
    return token.substring(0, 4) + '••••••••' + token.substring(token.length - 4);
  }

  function getSessionKey() {
    return 'molt_setup_wizard';
  }

  function saveState() {
    try {
      sessionStorage.setItem(getSessionKey(), JSON.stringify(state.formData));
    } catch (e) {
      console.warn('Failed to save state to sessionStorage:', e);
    }
  }

  function loadState() {
    try {
      var saved = sessionStorage.getItem(getSessionKey());
      if (saved) {
        var parsed = JSON.parse(saved);
        // Merge saved data with current formData
        for (var key in parsed) {
          if (parsed.hasOwnProperty(key)) {
            state.formData[key] = parsed[key];
          }
        }
        restoreFormData();
      }
    } catch (e) {
      console.warn('Failed to load state from sessionStorage:', e);
    }
  }

  function clearState() {
    try {
      sessionStorage.removeItem(getSessionKey());
    } catch (e) {
      console.warn('Failed to clear state from sessionStorage:', e);
    }
  }

  // ===================================
  // DOM Element Initialization
  // ===================================
  function initElements() {
    els.stepperItems = document.querySelectorAll('.step-item');
    els.stepContents = document.querySelectorAll('.step-content');
    els.navBack = $('#nav-back');
    els.navNext = $('#nav-next');
    els.authGroup = $('#authGroup');
    els.authChoice = $('#authChoice');
    els.authSecret = $('#authSecret');
    els.authSecretToggle = $('#authSecret-toggle');
    els.flow = $('#flow');
    els.atlasModelGroup = $('#atlas-model-group');
    els.atlasModel = $('#atlasModel');
    els.atlasModelInfo = $('#atlas-model-info');
    els.atlasModelName = $('#atlas-model-name');
    els.atlasModelDesc = $('#atlas-model-desc');
    els.atlasModelContext = $('#atlas-model-context');
    els.atlasModelInput = $('#atlas-model-input');
    els.atlasModelOutput = $('#atlas-model-output');
    els.openrouterModelGroup = $('#openrouter-model-group');
    els.openrouterModel = $('#openrouterModel');
    els.openrouterModelInfo = $('#openrouter-model-info');
    els.openrouterModelName = $('#openrouter-model-name');
    els.openrouterModelDesc = $('#openrouter-model-desc');
    els.openrouterModelContext = $('#openrouter-model-context');
    els.openrouterModelInput = $('#openrouter-model-input');
    els.openrouterModelOutput = $('#openrouter-model-output');
    els.modelscopeModelGroup = $('#modelscope-model-group');
    els.modelscopeModel = $('#modelscopeModel');
    els.modelscopeModelInfo = $('#modelscope-model-info');
    els.modelscopeModelName = $('#modelscope-model-name');
    els.modelscopeModelDesc = $('#modelscope-model-desc');
    els.modelscopeModelContext = $('#modelscope-model-context');
    els.modelscopeModelInput = $('#modelscope-model-input');
    els.modelscopeModelOutput = $('#modelscope-model-output');
    els.telegramToken = $('#telegramToken');
    els.discordToken = $('#discordToken');
    els.slackBotToken = $('#slackBotToken');
    els.slackAppToken = $('#slackAppToken');
    els.confirmSetup = $('#confirmSetup');
    els.log = $('#log');
    els.errorLog = $('#error-log');
    els.progressFill = $('#progress-fill');
    els.progressText = $('#progress-text');
    els.progressContainer = $('#progress-container');
    els.successContainer = $('#success-container');
    els.errorContainer = $('#error-container');
    els.configuredBanner = $('#configured-banner');
    els.statusText = $('#status-text');
    els.step1Next = $('#step1-next');
    els.accordionHeaders = document.querySelectorAll('.accordion-header');
    // Pairing requests elements
    els.pairingRequestsSection = $('#pairing-requests-section');
    els.pairingRefreshBtn = $('#pairing-refresh-btn');
    els.pairingLoading = $('#pairing-loading');
    els.pairingEmpty = $('#pairing-empty');
    els.pairingList = $('#pairing-list');
    els.pairingError = $('#pairing-error');
  }

  // ===================================
  // Step Navigation
  // ===================================
  function showStep(stepNumber) {
    // Update state
    state.currentStep = stepNumber;

    // Update step content visibility
    els.stepContents.forEach(function (content) {
      var step = parseInt(content.getAttribute('data-step'), 10);
      if (step === stepNumber) {
        content.classList.add('active');
        content.hidden = false;
      } else {
        content.classList.remove('active');
        content.hidden = true;
      }
    });

    // Update stepper visual state
    els.stepperItems.forEach(function (item) {
      var step = parseInt(item.getAttribute('data-step'), 10);
      item.classList.remove('active', 'completed');
      if (step === stepNumber) {
        item.classList.add('active');
      } else if (step < stepNumber) {
        item.classList.add('completed');
      }
    });

    // Update navigation buttons
    updateNavButtons();

    // Special handling for specific steps
    if (stepNumber === 4) {
      populateReviewStep();
    }

    // Focus first input on step 2 and 3 for accessibility
    if (stepNumber === 2 && els.authGroup) {
      els.authGroup.focus();
    } else if (stepNumber === 3 && els.accordionHeaders && els.accordionHeaders.length > 0) {
      els.accordionHeaders[0].focus();
    }
  }

  function updateNavButtons() {
    var isStep1 = state.currentStep === 1;
    var isStep5 = state.currentStep === 5;
    var isStep4 = state.currentStep === 4;

    // Back button
    if (els.navBack) {
      els.navBack.disabled = isStep1;
      if (isStep5) {
        els.navBack.textContent = 'Back';
      }
    }

    // Next button
    if (els.navNext) {
      if (isStep4) {
        setText(els.navNext, 'Run Setup');
      } else if (isStep5) {
        hideElement(els.navNext);
      } else {
        setText(els.navNext, 'Next');
      }
      els.navNext.disabled = false;
    }
  }

  function handleBack() {
    if (state.currentStep > 1) {
      showStep(state.currentStep - 1);
    }
  }

  function handleNext() {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return;
    }

    // Save form data
    saveFormData();

    if (state.currentStep < state.totalSteps) {
      showStep(state.currentStep + 1);
    }

    // If moving to step 5, run onboarding
    if (state.currentStep === 5) {
      runOnboarding();
    }
  }

  // ===================================
  // Form Data Management
  // ===================================
  function saveFormData() {
    state.formData.authGroup = els.authGroup ? els.authGroup.value : '';
    state.formData.authChoice = els.authChoice ? els.authChoice.value : '';
    state.formData.authSecret = els.authSecret ? els.authSecret.value : '';
    state.formData.flow = els.flow ? els.flow.value : 'quickstart';
    state.formData.atlasModel = els.atlasModel ? els.atlasModel.value : 'deepseek-ai/deepseek-v3.2';
    state.formData.openrouterModel = els.openrouterModel ? els.openrouterModel.value : 'anthropic/claude-sonnet-4';
    state.formData.modelscopeModel = els.modelscopeModel ? els.modelscopeModel.value : 'deepseek-ai/DeepSeek-V3.2';
    state.formData.telegramToken = els.telegramToken ? els.telegramToken.value : '';
    state.formData.discordToken = els.discordToken ? els.discordToken.value : '';
    state.formData.slackBotToken = els.slackBotToken ? els.slackBotToken.value : '';
    state.formData.slackAppToken = els.slackAppToken ? els.slackAppToken.value : '';

    saveState();
  }

  function restoreFormData() {
    if (els.authGroup && state.formData.authGroup) {
      els.authGroup.value = state.formData.authGroup;
    }
    if (els.authChoice && state.formData.authChoice) {
      els.authChoice.value = state.formData.authChoice;
    }
    if (els.authSecret && state.formData.authSecret) {
      els.authSecret.value = state.formData.authSecret;
    }
    if (els.flow && state.formData.flow) {
      els.flow.value = state.formData.flow;
    }
    if (els.atlasModel && state.formData.atlasModel) {
      els.atlasModel.value = state.formData.atlasModel;
    }
    if (els.openrouterModel && state.formData.openrouterModel) {
      els.openrouterModel.value = state.formData.openrouterModel;
    }
    if (els.modelscopeModel && state.formData.modelscopeModel) {
      els.modelscopeModel.value = state.formData.modelscopeModel;
    }
    if (els.telegramToken && state.formData.telegramToken) {
      els.telegramToken.value = state.formData.telegramToken;
    }
    if (els.discordToken && state.formData.discordToken) {
      els.discordToken.value = state.formData.discordToken;
    }
    if (els.slackBotToken && state.formData.slackBotToken) {
      els.slackBotToken.value = state.formData.slackBotToken;
    }
    if (els.slackAppToken && state.formData.slackAppToken) {
      els.slackAppToken.value = state.formData.slackAppToken;
    }
  }

  // ===================================
  // Validation
  // ===================================
  function validateCurrentStep() {
    var errorEl = $('#step' + state.currentStep + '-error');
    if (errorEl) {
      hideElement(errorEl);
      setText(errorEl, '');
    }

    switch (state.currentStep) {
      case 2:
        return validateAuthStep(errorEl);
      case 4:
        return validateReviewStep(errorEl);
      default:
        return true;
    }
  }

  function validateAuthStep(errorEl) {
    if (!els.authGroup || !els.authGroup.value) {
      showError(errorEl, 'Please select a provider group.');
      if (els.authGroup) els.authGroup.focus();
      return false;
    }

    if (!els.authChoice || !els.authChoice.value) {
      showError(errorEl, 'Please select an authentication method.');
      if (els.authChoice) els.authChoice.focus();
      return false;
    }

    // Check if auth secret is required (not empty after trim)
    if (els.authSecret && els.authSecret.value.trim() === '') {
      showError(errorEl, 'Please enter your API key or token.');
      if (els.authSecret) els.authSecret.focus();
      return false;
    }

    return true;
  }

  function validateReviewStep(errorEl) {
    if (!els.confirmSetup || !els.confirmSetup.checked) {
      showError(errorEl, 'Please confirm that the settings are correct.');
      if (els.confirmSetup) els.confirmSetup.focus();
      return false;
    }
    return true;
  }

  function showError(errorEl, message) {
    if (errorEl) {
      setText(errorEl, message);
      showElement(errorEl);
      errorEl.setAttribute('aria-live', 'polite');
    }
  }

  // ===================================
  // Review Step
  // ===================================
  function populateReviewStep() {
    saveFormData();

    var authGroupLabel = getSelectedLabel(els.authGroup);
    var authChoiceLabel = getSelectedLabel(els.authChoice);
    var flowLabel = getSelectedLabel(els.flow);

    setText($('#review-authGroup'), authGroupLabel || '-');
    setText($('#review-authChoice'), authChoiceLabel || '-');
    setText($('#review-authSecret'), maskToken(state.formData.authSecret));
    setText($('#review-flow'), flowLabel || '-');

    // Show OpenRouter model in review if selected
    var openrouterModelRow = $('#review-openrouter-model-row');
    var openrouterModelEl = $('#review-openrouterModel');
    if (openrouterModelRow && openrouterModelEl) {
      if (state.formData.authChoice === 'openrouter-api-key' && state.formData.openrouterModel) {
        showElement(openrouterModelRow);
        var orVal = state.formData.openrouterModel;
        var orBaseId = orVal.replace(/:[\w-]+$/, '');
        var orDisplayName = orVal;
        for (var ori = 0; ori < state.openrouterModels.length; ori++) {
          if (state.openrouterModels[ori].id === orVal || state.openrouterModels[ori].id === orBaseId) {
            var orSuffix = orVal !== state.openrouterModels[ori].id ? orVal.slice(state.openrouterModels[ori].id.length) : '';
            orDisplayName = state.openrouterModels[ori].name + (orSuffix ? ' ' + orSuffix : '');
            break;
          }
        }
        setText(openrouterModelEl, orDisplayName);
        openrouterModelEl.style.color = 'var(--success)';
      } else {
        hideElement(openrouterModelRow);
      }
    }

    // Show Atlas Cloud model in review if selected
    var atlasModelRow = $('#review-atlas-model-row');
    var atlasModelEl = $('#review-atlasModel');
    if (atlasModelRow && atlasModelEl) {
      if (state.formData.authChoice === 'atlas-api-key' && state.formData.atlasModel) {
        showElement(atlasModelRow);
        // Find model name from models list
        var modelName = state.formData.atlasModel;
        for (var i = 0; i < state.atlasModels.length; i++) {
          if (state.atlasModels[i].id === state.formData.atlasModel) {
            modelName = state.atlasModels[i].name;
            break;
          }
        }
        setText(atlasModelEl, modelName);
        atlasModelEl.style.color = 'var(--success)';
      } else {
        hideElement(atlasModelRow);
      }
    }

    // Show ModelScope model in review if selected
    var modelscopeModelRow = $('#review-modelscope-model-row');
    var modelscopeModelEl = $('#review-modelscopeModel');
    if (modelscopeModelRow && modelscopeModelEl) {
      if (state.formData.authChoice === 'modelscope-api-key' && state.formData.modelscopeModel) {
        showElement(modelscopeModelRow);
        var msModelName = state.formData.modelscopeModel;
        for (var mi = 0; mi < state.modelscopeModels.length; mi++) {
          if (state.modelscopeModels[mi].id === state.formData.modelscopeModel) {
            msModelName = state.modelscopeModels[mi].name;
            break;
          }
        }
        setText(modelscopeModelEl, msModelName);
        modelscopeModelEl.style.color = 'var(--success)';
      } else {
        hideElement(modelscopeModelRow);
      }
    }

    // Channels
    var telegramEl = $('#review-telegram');
    var discordEl = $('#review-discord');
    var slackEl = $('#review-slack');

    if (telegramEl) {
      setText(telegramEl, state.formData.telegramToken ? 'Configured' : 'Not configured');
      telegramEl.style.color = state.formData.telegramToken ? 'var(--success)' : 'var(--text-muted)';
    }

    if (discordEl) {
      setText(discordEl, state.formData.discordToken ? 'Configured' : 'Not configured');
      discordEl.style.color = state.formData.discordToken ? 'var(--success)' : 'var(--text-muted)';
    }

    if (slackEl) {
      var hasSlack = state.formData.slackBotToken || state.formData.slackAppToken;
      setText(slackEl, hasSlack ? 'Configured' : 'Not configured');
      slackEl.style.color = hasSlack ? 'var(--success)' : 'var(--text-muted)';
    }
  }

  function getSelectedLabel(selectEl) {
    if (!selectEl || !selectEl.selectedOptions || selectEl.selectedOptions.length === 0) {
      return '';
    }
    return selectEl.selectedOptions[0].textContent;
  }

  // ===================================
  // Auth Provider Management
  // ===================================
  function renderAuth(groups) {
    if (!els.authGroup) return;

    state.authGroups = groups || [];

    // Clear existing options
    els.authGroup.innerHTML = '';

    // Add placeholder
    var placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = 'Select a provider group';
    els.authGroup.appendChild(placeholderOpt);

    // Add provider groups
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var opt = document.createElement('option');
      opt.value = g.value;
      opt.textContent = g.label + (g.hint ? ' - ' + g.hint : '');
      els.authGroup.appendChild(opt);
    }

    // Set up change handler
    els.authGroup.onchange = function () {
      updateAuthChoices();
    };

    // Restore saved selection if available
    if (state.formData.authGroup) {
      els.authGroup.value = state.formData.authGroup;
      updateAuthChoices();
      if (state.formData.authChoice && els.authChoice) {
        els.authChoice.value = state.formData.authChoice;
      }
    }
  }

  function updateAuthChoices() {
    if (!els.authChoice) return;

    els.authChoice.innerHTML = '';

    var selectedGroup = null;
    for (var j = 0; j < state.authGroups.length; j++) {
      if (state.authGroups[j].value === els.authGroup.value) {
        selectedGroup = state.authGroups[j];
        break;
      }
    }

    var opts = (selectedGroup && selectedGroup.options) ? selectedGroup.options : [];

    // Add placeholder
    var placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = 'Select an authentication method';
    els.authChoice.appendChild(placeholderOpt);

    for (var k = 0; k < opts.length; k++) {
      var o = opts[k];
      var opt2 = document.createElement('option');
      opt2.value = o.value;
      opt2.textContent = o.label + (o.hint ? ' - ' + o.hint : '');
      els.authChoice.appendChild(opt2);
    }

    // Show/hide OpenRouter model dropdown
    if (els.openrouterModelGroup) {
      if (selectedGroup && selectedGroup.value === 'openrouter' && selectedGroup.models) {
        state.openrouterModels = selectedGroup.models;
        populateOpenrouterModels(selectedGroup.models);
        showElement(els.openrouterModelGroup);
        if (state.formData.openrouterModel) {
          els.openrouterModel.value = state.formData.openrouterModel;
          updateOpenrouterModelInfo();
        }
      } else {
        hideElement(els.openrouterModelGroup);
      }
    }

    // Show/hide Atlas Cloud model dropdown
    if (els.atlasModelGroup) {
      if (selectedGroup && selectedGroup.value === 'atlas' && selectedGroup.models) {
        state.atlasModels = selectedGroup.models;
        populateAtlasModels(selectedGroup.models);
        showElement(els.atlasModelGroup);
        // Restore saved model selection
        if (state.formData.atlasModel) {
          els.atlasModel.value = state.formData.atlasModel;
          updateAtlasModelInfo();
        }
      } else {
        hideElement(els.atlasModelGroup);
      }
    }

    // Show/hide ModelScope model dropdown
    if (els.modelscopeModelGroup) {
      if (selectedGroup && selectedGroup.value === 'modelscope' && selectedGroup.models) {
        state.modelscopeModels = selectedGroup.models;
        populateModelscopeModels(selectedGroup.models);
        showElement(els.modelscopeModelGroup);
        if (state.formData.modelscopeModel) {
          els.modelscopeModel.value = state.formData.modelscopeModel;
          updateModelscopeModelInfo();
        }
      } else {
        hideElement(els.modelscopeModelGroup);
      }
    }
  }

  // ===================================
  // OpenRouter Model Selection
  // ===================================
  function populateOpenrouterModels(models) {
    if (!els.openrouterModel) return;

    var datalist = document.getElementById('openrouterModelList');
    if (datalist) {
      datalist.innerHTML = '';
      for (var i = 0; i < models.length; i++) {
        var m = models[i];
        var opt = document.createElement('option');
        opt.value = m.id;
        opt.label = m.name;
        datalist.appendChild(opt);
      }
    }

    els.openrouterModel.oninput = updateOpenrouterModelInfo;
    els.openrouterModel.onchange = updateOpenrouterModelInfo;

    if (!els.openrouterModel.value && state.formData.openrouterModel) {
      els.openrouterModel.value = state.formData.openrouterModel;
    }

    updateOpenrouterModelInfo();
  }

  function updateOpenrouterModelInfo() {
    if (!els.openrouterModel || !els.openrouterModelInfo || !state.openrouterModels) return;

    var inputVal = els.openrouterModel.value.trim();
    // Strip known suffixes (e.g. :online, :extended) to match base model
    var baseId = inputVal.replace(/:[\w-]+$/, '');
    var selectedModel = null;

    for (var j = 0; j < state.openrouterModels.length; j++) {
      if (state.openrouterModels[j].id === inputVal || state.openrouterModels[j].id === baseId) {
        selectedModel = state.openrouterModels[j];
        break;
      }
    }

    if (selectedModel) {
      var suffix = inputVal !== selectedModel.id ? inputVal.slice(selectedModel.id.length) : '';
      showElement(els.openrouterModelInfo);
      if (els.openrouterModelName) setText(els.openrouterModelName, selectedModel.name + (suffix ? ' ' + suffix : ''));
      if (els.openrouterModelDesc) setText(els.openrouterModelDesc, selectedModel.description || '');
      if (els.openrouterModelContext) setText(els.openrouterModelContext, formatNumber(selectedModel.contextWindow / 1000) + 'K');
      if (els.openrouterModelInput) setText(els.openrouterModelInput, selectedModel.inputPrice.toFixed(2));
      if (els.openrouterModelOutput) setText(els.openrouterModelOutput, selectedModel.outputPrice.toFixed(2));
    } else if (inputVal) {
      // Custom model ID — show info box with the raw ID, no pricing
      showElement(els.openrouterModelInfo);
      if (els.openrouterModelName) setText(els.openrouterModelName, inputVal);
      if (els.openrouterModelDesc) setText(els.openrouterModelDesc, 'Custom model ID');
      if (els.openrouterModelContext) setText(els.openrouterModelContext, '—');
      if (els.openrouterModelInput) setText(els.openrouterModelInput, '—');
      if (els.openrouterModelOutput) setText(els.openrouterModelOutput, '—');
    } else {
      hideElement(els.openrouterModelInfo);
    }
  }

  // ===================================
  // Atlas Cloud Model Selection
  // ===================================
  function populateAtlasModels(models) {
    if (!els.atlasModel) return;

    els.atlasModel.innerHTML = '';

    // Add models to dropdown
    for (var i = 0; i < models.length; i++) {
      var m = models[i];
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      els.atlasModel.appendChild(opt);
    }

    // Set up change handler
    els.atlasModel.onchange = updateAtlasModelInfo;

    // Show info for default/first model
    updateAtlasModelInfo();
  }

  function updateAtlasModelInfo() {
    if (!els.atlasModel || !els.atlasModelInfo || !state.atlasModels) return;

    var selectedId = els.atlasModel.value;
    var selectedModel = null;

    for (var j = 0; j < state.atlasModels.length; j++) {
      if (state.atlasModels[j].id === selectedId) {
        selectedModel = state.atlasModels[j];
        break;
      }
    }

    if (selectedModel) {
      showElement(els.atlasModelInfo);
      if (els.atlasModelName) setText(els.atlasModelName, selectedModel.name);
      if (els.atlasModelDesc) setText(els.atlasModelDesc, selectedModel.description || '');
      if (els.atlasModelContext) setText(els.atlasModelContext, formatNumber(selectedModel.contextWindow / 1000) + 'K');
      if (els.atlasModelInput) setText(els.atlasModelInput, selectedModel.inputPrice.toFixed(2));
      if (els.atlasModelOutput) setText(els.atlasModelOutput, selectedModel.outputPrice.toFixed(2));
    } else {
      hideElement(els.atlasModelInfo);
    }
  }

  // ===================================
  // ModelScope Model Selection
  // ===================================
  function populateModelscopeModels(models) {
    if (!els.modelscopeModel) return;

    els.modelscopeModel.innerHTML = '';

    for (var i = 0; i < models.length; i++) {
      var m = models[i];
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      els.modelscopeModel.appendChild(opt);
    }

    els.modelscopeModel.onchange = updateModelscopeModelInfo;

    updateModelscopeModelInfo();
  }

  function updateModelscopeModelInfo() {
    if (!els.modelscopeModel || !els.modelscopeModelInfo || !state.modelscopeModels) return;

    var selectedId = els.modelscopeModel.value;
    var selectedModel = null;

    for (var j = 0; j < state.modelscopeModels.length; j++) {
      if (state.modelscopeModels[j].id === selectedId) {
        selectedModel = state.modelscopeModels[j];
        break;
      }
    }

    if (selectedModel) {
      showElement(els.modelscopeModelInfo);
      if (els.modelscopeModelName) setText(els.modelscopeModelName, selectedModel.name);
      if (els.modelscopeModelDesc) setText(els.modelscopeModelDesc, selectedModel.description || '');
      if (els.modelscopeModelContext) setText(els.modelscopeModelContext, formatNumber(selectedModel.contextWindow / 1000) + 'K');
      if (els.modelscopeModelInput) setText(els.modelscopeModelInput, selectedModel.inputPrice.toFixed(2));
      if (els.modelscopeModelOutput) setText(els.modelscopeModelOutput, selectedModel.outputPrice.toFixed(2));
    } else {
      hideElement(els.modelscopeModelInfo);
    }
  }

  function formatNumber(num) {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ===================================
  // Password Visibility Toggle
  // ===================================
  function setupPasswordToggle() {
    if (!els.authSecretToggle || !els.authSecret) return;

    els.authSecretToggle.onclick = function () {
      var isPressed = els.authSecretToggle.getAttribute('aria-pressed') === 'true';
      var eyeIcon = els.authSecretToggle.querySelector('.eye-icon');
      var eyeOffIcon = els.authSecretToggle.querySelector('.eye-off-icon');

      if (isPressed) {
        // Hide password
        els.authSecret.type = 'password';
        els.authSecretToggle.setAttribute('aria-pressed', 'false');
        els.authSecretToggle.setAttribute('aria-label', 'Show password');
        hideElement(eyeIcon);
        showElement(eyeOffIcon);
      } else {
        // Show password
        els.authSecret.type = 'text';
        els.authSecretToggle.setAttribute('aria-pressed', 'true');
        els.authSecretToggle.setAttribute('aria-label', 'Hide password');
        showElement(eyeIcon);
        hideElement(eyeOffIcon);
      }
    };
  }

  // ===================================
  // Accordion
  // ===================================
  function setupAccordion() {
    if (!els.accordionHeaders) return;

    els.accordionHeaders.forEach(function (header) {
      header.onclick = function () {
        var isExpanded = header.getAttribute('aria-expanded') === 'true';
        var controls = header.getAttribute('aria-controls');
        var content = document.getElementById(controls);

        if (isExpanded) {
          header.setAttribute('aria-expanded', 'false');
          if (content) hideElement(content);
        } else {
          header.setAttribute('aria-expanded', 'true');
          if (content) showElement(content);
        }
      };
    });
  }

  // ===================================
  // API Integration
  // ===================================
  function httpJson(url, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    return fetch(url, opts).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          throw new Error('HTTP ' + res.status + ': ' + (t || res.statusText));
        });
      }
      return res.json();
    });
  }

  function refreshStatus() {
    return httpJson('/setup/api/status').then(function (j) {
      state.isConfigured = j.configured;

      var ver = j.openclawVersion ? (' | ' + j.openclawVersion) : '';

      if (els.statusText) {
        els.statusText.textContent = (j.configured ? 'OpenClaw is configured' : 'Not configured') + ver;
      }

      if (j.configured && els.configuredBanner) {
        showElement(els.configuredBanner);
        // Load pending pairing requests when configured
        refreshPairingRequests();
      }

      renderAuth(j.authGroups || []);

      // Check for channel support warnings
      if (j.channelsAddHelp && j.channelsAddHelp.indexOf('telegram') === -1 && els.log) {
        els.log.textContent += '\nNote: this openclaw build does not list telegram in `channels add --help`. Telegram auto-add will be skipped.\n';
      }

    }).catch(function (e) {
      console.error('Status check failed:', e);
      if (els.statusText) {
        els.statusText.textContent = 'Error: ' + String(e);
      }
    });
  }

  function refreshPairingRequests() {
    if (!els.pairingRequestsSection) return;

    // Clear any existing auto-refresh timer
    if (state.pairingRefreshTimer) {
      clearTimeout(state.pairingRefreshTimer);
      state.pairingRefreshTimer = null;
    }

    // Add spinning animation to refresh button
    if (els.pairingRefreshBtn) {
      var svg = els.pairingRefreshBtn.querySelector('svg');
      if (svg) svg.classList.add('spinning');
    }

    // Show the section and loading state
    showElement(els.pairingRequestsSection);
    if (els.pairingLoading) showElement(els.pairingLoading);
    if (els.pairingEmpty) hideElement(els.pairingEmpty);
    if (els.pairingList) els.pairingList.innerHTML = '';
    if (els.pairingError) hideElement(els.pairingError);

    httpJson('/setup/api/pairing/list').then(function (j) {
      if (els.pairingLoading) hideElement(els.pairingLoading);

      // Remove spinning animation
      if (els.pairingRefreshBtn) {
        var svg = els.pairingRefreshBtn.querySelector('svg');
        if (svg) svg.classList.remove('spinning');
      }

      if (!j.ok) {
        if (els.pairingError) {
          els.pairingError.textContent = 'Failed to load pairing requests';
          showElement(els.pairingError);
        }
        // Retry on error after 30 seconds
        state.pairingRefreshTimer = setTimeout(refreshPairingRequests, 30000);
        return;
      }

      if (!j.requests || j.requests.length === 0) {
        if (els.pairingEmpty) showElement(els.pairingEmpty);
        // Auto-refresh when empty - user might be generating a code right now
        state.pairingRefreshTimer = setTimeout(refreshPairingRequests, 30000);
        return;
      }

      // Has pending requests - no auto-refresh, let user approve manually
      // Render each request as a card
      if (els.pairingList) {
        els.pairingList.innerHTML = j.requests.map(function (req) {
          var date = new Date(req.timestamp);
          var timeStr = date.toLocaleString();
          return '<div class="review-section" style="margin-bottom: 1rem;">' +
            '<div class="review-item">' +
              '<span class="review-label">User ID:</span>' +
              '<span class="review-value">' + escapeHtml(req.userId) + '</span>' +
            '</div>' +
            '<div class="review-item">' +
              '<span class="review-label">Requested:</span>' +
              '<span class="review-value">' + escapeHtml(timeStr) + '</span>' +
            '</div>' +
            '<div class="review-item">' +
              '<span class="review-label">Code:</span>' +
              '<span class="review-value" style="font-family: monospace;">' + escapeHtml(req.code) + '</span>' +
            '</div>' +
            '<button class="btn-primary" style="margin-top: 0.5rem;" onclick="approvePairingRequest(\'telegram\', \'' + escapeHtml(req.code) + '\')">Approve</button>' +
          '</div>';
        }).join('');
      }
    }).catch(function (e) {
      if (els.pairingLoading) hideElement(els.pairingLoading);

      // Remove spinning animation
      if (els.pairingRefreshBtn) {
        var svg = els.pairingRefreshBtn.querySelector('svg');
        if (svg) svg.classList.remove('spinning');
      }

      if (els.pairingError) {
        els.pairingError.textContent = 'Error: ' + String(e);
        showElement(els.pairingError);
      }
      // Retry on error after 30 seconds
      state.pairingRefreshTimer = setTimeout(refreshPairingRequests, 30000);
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Global function for approve button clicks
  window.approvePairingRequest = function (channel, code) {
    httpJson('/setup/api/pairing/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: channel, code: code })
    }).then(function (j) {
      if (j.ok) {
        // Refresh the list after approval
        refreshPairingRequests();
      } else {
        alert('Failed to approve: ' + (j.output || j.error || 'Unknown error'));
      }
    }).catch(function (e) {
      alert('Error approving request: ' + String(e));
    });
  };

  function runOnboarding() {
    saveFormData();

    // Hide all containers first
    hideElement(els.successContainer);
    hideElement(els.errorContainer);
    showElement(els.progressContainer);

    // Clear previous logs
    if (els.log) els.log.textContent = '';

    // Initialize progress
    updateProgress(10);

    var payload = {
      flow: state.formData.flow,
      authChoice: state.formData.authChoice,
      authSecret: state.formData.authSecret,
      atlasModel: state.formData.atlasModel,
      openrouterModel: state.formData.openrouterModel,
      modelscopeModel: state.formData.modelscopeModel,
      telegramToken: state.formData.telegramToken,
      discordToken: state.formData.discordToken,
      slackBotToken: state.formData.slackBotToken,
      slackAppToken: state.formData.slackAppToken
    };

    if (els.log) {
      els.log.textContent = 'Starting onboarding...\n';
    }

    // Simulate progress updates
    var progressInterval = setInterval(function () {
      var currentProgress = parseInt(els.progressFill.getAttribute('aria-valuenow') || 10, 10);
      if (currentProgress < 70) {
        updateProgress(currentProgress + 10);
      }
    }, 1000);

    fetch('/setup/api/run', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.text();
    }).then(function (text) {
      clearInterval(progressInterval);
      updateProgress(90);

      var j;
      try {
        j = JSON.parse(text);
      } catch (_e) {
        j = { ok: false, output: text };
      }

      if (els.log) {
        els.log.textContent += (j.output || JSON.stringify(j, null, 2));
      }

      updateProgress(100);

      // Check if successful
      var isSuccess = j.ok !== false && !text.toLowerCase().includes('error');

      setTimeout(function () {
        hideElement(els.progressContainer);

        if (isSuccess) {
          showElement(els.successContainer);
          clearState();
          // Update gateway links with token after successful setup
          setupGatewayLinks();
        } else {
          showElement(els.errorContainer);
          if (els.errorLog) {
            els.errorLog.textContent = els.log.textContent;
          }
        }
      }, 500);

      return refreshStatus();

    }).catch(function (e) {
      clearInterval(progressInterval);
      updateProgress(100);

      if (els.log) {
        els.log.textContent += '\nError: ' + String(e) + '\n';
      }

      setTimeout(function () {
        hideElement(els.progressContainer);
        showElement(els.errorContainer);
        if (els.errorLog) {
          els.errorLog.textContent = els.log.textContent;
        }
      }, 500);
    });
  }

  function updateProgress(percent) {
    if (els.progressFill) {
      els.progressFill.style.width = percent + '%';
      els.progressFill.setAttribute('aria-valuenow', percent);
    }
    if (els.progressText) {
      setText(els.progressText, percent + '%');
    }
  }

  // ===================================
  // Reset Functionality
  // ===================================
  function setupResetHandlers() {
    var resetBtn = $('#reset');
    var resetFromBannerBtn = $('#reset-from-banner');
    var retryBtn = $('#retry-setup');
    var resetSetupBtn = $('#reset-setup');
    var pairingRefreshBtn = $('#pairing-refresh-btn');

    if (resetBtn) {
      resetBtn.onclick = handleReset;
    }

    if (resetFromBannerBtn) {
      resetFromBannerBtn.onclick = handleReset;
    }

    if (retryBtn) {
      retryBtn.onclick = function () {
        showStep(2);
      };
    }

    if (resetSetupBtn) {
      resetSetupBtn.onclick = handleReset;
    }

    if (pairingRefreshBtn) {
      pairingRefreshBtn.onclick = function () {
        refreshPairingRequests();
      };
    }
  }

  function handleReset() {
    if (!confirm('Reset setup? This deletes the config file so onboarding can run again.')) return;

    if (els.log) els.log.textContent = 'Resetting...\n';

    fetch('/setup/api/reset', {
      method: 'POST',
      credentials: 'same-origin'
    })
      .then(function (res) { return res.text(); })
      .then(function (t) {
        if (els.log) els.log.textContent += t + '\n';
        clearState();
        // Reset form
        state.formData = {
          authGroup: '',
          authChoice: '',
          authSecret: '',
          flow: 'quickstart',
          atlasModel: 'deepseek-ai/deepseek-v3.2',
          openrouterModel: 'anthropic/claude-sonnet-4',
          modelscopeModel: 'deepseek-ai/DeepSeek-V3.2',
          telegramToken: '',
          discordToken: '',
          slackBotToken: '',
          slackAppToken: ''
        };
        restoreFormData();
        // Go back to step 1
        showStep(1);
        return refreshStatus();
      })
      .catch(function (e) {
        if (els.log) els.log.textContent += 'Error: ' + String(e) + '\n';
      });
  }

  // ===================================
  // Download Backup
  // ===================================
  function setupDownloadBackup() {
    var downloadBtn = $('#download-backup');
    if (downloadBtn) {
      downloadBtn.onclick = function () {
        window.open('/setup/export', '_blank');
      };
    }
  }

  // ===================================
  // Gateway URL with Token
  // ===================================
  function setupGatewayLinks() {
    // Fetch gateway URL with token and update all gateway links
    httpJson('/setup/api/gateway-url').then(function (j) {
      var gatewayUrl = j.url;

      // Update "Open OpenClaw UI" button in success container
      var openUiBtn = $('a[href="/openclaw"]');
      if (openUiBtn) {
        openUiBtn.setAttribute('href', gatewayUrl);
      }

      // Update "Open UI" link in configured banner
      var bannerUiLink = $('#configured-banner a[href="/openclaw"]');
      if (bannerUiLink) {
        bannerUiLink.setAttribute('href', gatewayUrl);
      }
    }).catch(function (e) {
      console.warn('Failed to fetch gateway URL:', e);
      // Fallback to /openclaw without token if API fails
    });
  }

  // ===================================
  // Keyboard Shortcuts
  // ===================================
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Enter key - advance to next step
      if (e.key === 'Enter' && !e.shiftKey) {
        // Don't trigger if typing in input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (state.currentStep < state.totalSteps) {
            handleNext();
          }
        }
      }

      // Escape key - go back
      if (e.key === 'Escape') {
        if (state.currentStep > 1) {
          handleBack();
        }
      }

      // Arrow keys - navigate between steps
      if (e.key === 'ArrowRight' && !e.shiftKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        if (state.currentStep < state.totalSteps) {
          handleNext();
        }
      }

      if (e.key === 'ArrowLeft' && !e.shiftKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        if (state.currentStep > 1) {
          handleBack();
        }
      }
    });
  }

  // ===================================
  // Initialization
  // ===================================
  function init() {
    // Initialize DOM elements
    initElements();

    // Load saved state
    loadState();

    // Setup event handlers
    if (els.navBack) {
      els.navBack.onclick = handleBack;
    }

    if (els.navNext) {
      els.navNext.onclick = handleNext;
    }

    if (els.step1Next) {
      els.step1Next.onclick = handleNext;
    }

    // Setup password toggle
    setupPasswordToggle();

    // Setup accordion
    setupAccordion();

    // Setup reset handlers
    setupResetHandlers();

    // Setup download backup
    setupDownloadBackup();

    // Setup gateway links with token
    setupGatewayLinks();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Refresh status and load providers
    refreshStatus().then(function () {
      // If already configured, show banner
      if (state.isConfigured) {
        // User can still navigate through wizard but banner is shown
        console.log('OpenClaw is already configured');
      }
    });

    // Start at step 1
    showStep(1);
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
