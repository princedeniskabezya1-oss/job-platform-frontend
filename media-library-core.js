"use strict";

/* =========================================================
   AIFT MEDIA LIBRARY
   PART 1 OF 15
   CORE APPLICATION ENGINE
========================================================= */

(function initializeAiftMediaLibraryGlobal(
  windowObject,
  documentObject
) {
  if (
    !windowObject ||
    !documentObject
  ) {
    return;
  }

  if (
    windowObject.AIFTMediaLibrary &&
    windowObject.AIFTMediaLibrary.__coreInitialized
  ) {
    console.warn(
      "[AIFT Media Library] Core engine has already been initialized."
    );

    return;
  }

  /* =========================================================
     APPLICATION CONSTANTS
  ========================================================= */

  const APPLICATION_NAME =
    "AIFT Media Library";

  const APPLICATION_VERSION =
    "1.0.0";

  const STORAGE_PREFIX =
    "aift.mediaLibrary";

  const DEFAULT_API_BASE_URL =
    "https://aift-backend-1-9b6f.onrender.com/api";

  const DEFAULT_REQUEST_TIMEOUT_MS =
    30000;

  const DEFAULT_UPLOAD_TIMEOUT_MS =
    180000;

  const DEFAULT_SEARCH_DELAY_MS =
    350;

  const DEFAULT_PAGE_SIZE =
    24;

  const MAX_PAGE_SIZE =
    100;

  const DEFAULT_VIEW_MODE =
    "grid";

  const SUPPORTED_VIEW_MODES =
    new Set([
      "grid",
      "list"
    ]);

  const SUPPORTED_LIBRARY_SCOPES =
    new Set([
      "all",
      "recent",
      "favorites",
      "trash",
      "folder"
    ]);

  const SUPPORTED_MEDIA_FILTERS =
    new Set([
      "all",
      "image",
      "video",
      "audio",
      "document",
      "pdf",
      "presentation",
      "spreadsheet",
      "archive",
      "other"
    ]);

  const SUPPORTED_SORT_OPTIONS =
    new Set([
      "newest",
      "oldest",
      "name-asc",
      "name-desc",
      "size-asc",
      "size-desc",
      "most-used",
      "most-downloaded"
    ]);

  const MEDIA_LIBRARY_EVENTS =
    Object.freeze({
      INITIALIZING:
        "media-library:initializing",

      INITIALIZED:
        "media-library:initialized",

      DESTROYING:
        "media-library:destroying",

      DESTROYED:
        "media-library:destroyed",

      STATE_CHANGED:
        "media-library:state-changed",

      AUTHENTICATION_REQUIRED:
        "media-library:authentication-required",

      REQUEST_STARTED:
        "media-library:request-started",

      REQUEST_FINISHED:
        "media-library:request-finished",

      REQUEST_FAILED:
        "media-library:request-failed",

      LIBRARY_LOADING:
        "media-library:library-loading",

      LIBRARY_LOADED:
        "media-library:library-loaded",

      LIBRARY_FAILED:
        "media-library:library-failed",

      FOLDERS_LOADING:
        "media-library:folders-loading",

      FOLDERS_LOADED:
        "media-library:folders-loaded",

      FOLDERS_FAILED:
        "media-library:folders-failed",

      ANALYTICS_LOADING:
        "media-library:analytics-loading",

      ANALYTICS_LOADED:
        "media-library:analytics-loaded",

      ANALYTICS_FAILED:
        "media-library:analytics-failed",

      UPLOAD_REQUESTED:
        "media-library:upload-requested",

      VIEW_CHANGED:
        "media-library:view-changed",

      SCOPE_CHANGED:
        "media-library:scope-changed",

      FILTER_CHANGED:
        "media-library:filter-changed",

      SORT_CHANGED:
        "media-library:sort-changed",

      SEARCH_CHANGED:
        "media-library:search-changed",

      PAGE_CHANGED:
        "media-library:page-changed",

      SELECTION_CHANGED:
        "media-library:selection-changed",

      NOTIFICATION:
        "media-library:notification"
    });

  const DOM_ID_CANDIDATES =
    Object.freeze({
      section: [
        "section-media"
      ],

      libraryList: [
        "mediaLibraryList",
        "aiftMediaLibraryList",
        "mediaLibraryGrid"
      ],

      folderTree: [
        "mediaFolderTree",
        "aiftMediaFolderTree"
      ],

      searchInput: [
        "mediaSearchInput",
        "aiftMediaSearchInput"
      ],

      clearSearchButton: [
        "clearMediaSearchButton",
        "mediaSearchClearButton"
      ],

      typeFilter: [
        "mediaTypeFilter",
        "aiftMediaTypeFilter"
      ],

      sortSelect: [
        "mediaSortSelect",
        "aiftMediaSortSelect"
      ],

      gridViewButton: [
        "mediaGridViewButton",
        "aiftMediaGridViewButton"
      ],

      listViewButton: [
        "mediaListViewButton",
        "aiftMediaListViewButton"
      ],

      refreshButton: [
        "mediaRefreshButton",
        "aiftMediaRefreshButton"
      ],

      uploadButton: [
        "mediaUploadButton",
        "aiftMediaUploadButton"
      ],

      fileInput: [
        "mediaFileInput",
        "aiftMediaFileInput"
      ],

      dropZone: [
        "mediaDropZone",
        "aiftMediaDropZone"
      ],

      uploadQueue: [
        "mediaUploadQueue",
        "aiftMediaUploadQueue"
      ],

      uploadQueueList: [
        "mediaUploadQueueList",
        "aiftMediaUploadQueueList"
      ],

      uploadQueueSummary: [
        "mediaUploadQueueSummary",
        "aiftMediaUploadQueueSummary"
      ],

      clearUploadQueueButton: [
        "clearMediaUploadQueueButton",
        "aiftClearMediaUploadQueueButton"
      ],

      breadcrumb: [
        "mediaBreadcrumb",
        "aiftMediaBreadcrumb"
      ],

      selectionActions: [
        "mediaSelectionActions",
        "aiftMediaSelectionActions"
      ],

      selectedCount: [
        "mediaSelectedCount",
        "aiftMediaSelectedCount"
      ],

      selectAllCheckbox: [
        "mediaSelectAllCheckbox",
        "aiftMediaSelectAllCheckbox"
      ],

      pagination: [
        "mediaPagination",
        "aiftMediaPagination"
      ],

      previousPageButton: [
        "mediaPreviousPageButton",
        "aiftMediaPreviousPageButton"
      ],

      nextPageButton: [
        "mediaNextPageButton",
        "aiftMediaNextPageButton"
      ],

      pageInformation: [
        "mediaPageInformation",
        "aiftMediaPageInformation"
      ],

      resultTitle: [
        "mediaResultTitle",
        "aiftMediaResultTitle"
      ],

      resultDescription: [
        "mediaResultDescription",
        "aiftMediaResultDescription"
      ],

      totalFilesValue: [
        "mediaTotalFilesValue",
        "aiftMediaTotalFilesValue"
      ],

      totalStorageValue: [
        "mediaTotalStorageValue",
        "aiftMediaTotalStorageValue"
      ],

      totalDownloadsValue: [
        "mediaTotalDownloadsValue",
        "aiftMediaTotalDownloadsValue"
      ],

      totalUsageValue: [
        "mediaTotalUsageValue",
        "aiftMediaTotalUsageValue"
      ],

      storagePercentageValue: [
        "mediaStoragePercentageValue",
        "aiftMediaStoragePercentageValue"
      ],

      storageProgressBar: [
        "mediaStorageProgressBar",
        "aiftMediaStorageProgressBar"
      ],

      storageDescription: [
        "mediaStorageDescription",
        "aiftMediaStorageDescription"
      ]
    });

  /* =========================================================
     GENERAL UTILITIES
  ========================================================= */

  function isObject(
    value
  ) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function isFunction(
    value
  ) {
    return (
      typeof value === "function"
    );
  }

  function isString(
    value
  ) {
    return (
      typeof value === "string"
    );
  }

  function isFiniteNumber(
    value
  ) {
    return (
      typeof value === "number" &&
      Number.isFinite(value)
    );
  }

  function safeString(
    value,
    fallbackValue = ""
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return String(
        fallbackValue || ""
      );
    }

    return String(value).trim();
  }

  function safeNumber(
    value,
    fallbackValue = 0
  ) {
    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return fallbackValue;
    }

    return numericValue;
  }

  function safeInteger(
    value,
    fallbackValue = 0
  ) {
    const numericValue =
      Number.parseInt(
        value,
        10
      );

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return fallbackValue;
    }

    return numericValue;
  }

  function clampNumber(
    value,
    minimumValue,
    maximumValue
  ) {
    const resolvedValue =
      safeNumber(
        value,
        minimumValue
      );

    return Math.min(
      maximumValue,
      Math.max(
        minimumValue,
        resolvedValue
      )
    );
  }

  function normalizeBoolean(
    value,
    fallbackValue = false
  ) {
    if (
      typeof value === "boolean"
    ) {
      return value;
    }

    if (
      value === 1 ||
      value === "1" ||
      value === "true"
    ) {
      return true;
    }

    if (
      value === 0 ||
      value === "0" ||
      value === "false"
    ) {
      return false;
    }

    return fallbackValue;
  }

  function normalizeArray(
    value
  ) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    return [value];
  }

  function uniqueArray(
    values
  ) {
    return Array.from(
      new Set(
        normalizeArray(values)
          .filter(
            value =>
              value !== null &&
              value !== undefined
          )
      )
    );
  }

  function createId(
    prefix = "media"
  ) {
    const randomPart =
      Math.random()
        .toString(36)
        .slice(2, 10);

    const timePart =
      Date.now()
        .toString(36);

    return [
      safeString(prefix, "media"),
      timePart,
      randomPart
    ].join("-");
  }

  function delay(
    durationMilliseconds
  ) {
    return new Promise(
      resolve => {
        windowObject.setTimeout(
          resolve,
          Math.max(
            0,
            safeInteger(
              durationMilliseconds,
              0
            )
          )
        );
      }
    );
  }

  function debounce(
    callback,
    delayMilliseconds =
      DEFAULT_SEARCH_DELAY_MS
  ) {
    if (
      !isFunction(callback)
    ) {
      throw new TypeError(
        "The debounce callback must be a function."
      );
    }

    let timerId =
      null;

    function debouncedFunction(
      ...argumentsList
    ) {
      if (
        timerId !== null
      ) {
        windowObject.clearTimeout(
          timerId
        );
      }

      timerId =
        windowObject.setTimeout(
          () => {
            timerId =
              null;

            callback.apply(
              this,
              argumentsList
            );
          },
          Math.max(
            0,
            safeInteger(
              delayMilliseconds,
              DEFAULT_SEARCH_DELAY_MS
            )
          )
        );
    }

    debouncedFunction.cancel =
      function cancelDebouncedFunction() {
        if (
          timerId !== null
        ) {
          windowObject.clearTimeout(
            timerId
          );

          timerId =
            null;
        }
      };

    debouncedFunction.flush =
      function flushDebouncedFunction(
        ...argumentsList
      ) {
        if (
          timerId !== null
        ) {
          windowObject.clearTimeout(
            timerId
          );

          timerId =
            null;
        }

        return callback.apply(
          this,
          argumentsList
        );
      };

    return debouncedFunction;
  }

  function throttle(
    callback,
    delayMilliseconds = 150
  ) {
    if (
      !isFunction(callback)
    ) {
      throw new TypeError(
        "The throttle callback must be a function."
      );
    }

    let lastExecutionTime =
      0;

    let pendingTimerId =
      null;

    let pendingArguments =
      null;

    let pendingContext =
      null;

    function executeCallback() {
      lastExecutionTime =
        Date.now();

      pendingTimerId =
        null;

      callback.apply(
        pendingContext,
        pendingArguments || []
      );

      pendingArguments =
        null;

      pendingContext =
        null;
    }

    function throttledFunction(
      ...argumentsList
    ) {
      const currentTime =
        Date.now();

      const remainingTime =
        delayMilliseconds -
        (
          currentTime -
          lastExecutionTime
        );

      pendingArguments =
        argumentsList;

      pendingContext =
        this;

      if (
        remainingTime <= 0
      ) {
        if (
          pendingTimerId !== null
        ) {
          windowObject.clearTimeout(
            pendingTimerId
          );

          pendingTimerId =
            null;
        }

        executeCallback();

        return;
      }

      if (
        pendingTimerId === null
      ) {
        pendingTimerId =
          windowObject.setTimeout(
            executeCallback,
            remainingTime
          );
      }
    }

    throttledFunction.cancel =
      function cancelThrottledFunction() {
        if (
          pendingTimerId !== null
        ) {
          windowObject.clearTimeout(
            pendingTimerId
          );
        }

        pendingTimerId =
          null;

        pendingArguments =
          null;

        pendingContext =
          null;
      };

    return throttledFunction;
  }

  function deepClone(
    value
  ) {
    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (
        cloningError
      ) {
        console.warn(
          "[AIFT Media Library] structuredClone failed. Falling back to JSON cloning.",
          cloningError
        );
      }
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (
      cloningError
    ) {
      return value;
    }
  }

  function deepMerge(
    targetObject,
    sourceObject
  ) {
    const result =
      isObject(targetObject)
        ? {
            ...targetObject
          }
        : {};

    if (
      !isObject(sourceObject)
    ) {
      return result;
    }

    Object.entries(
      sourceObject
    ).forEach(
      ([
        propertyName,
        propertyValue
      ]) => {
        if (
          isObject(propertyValue)
        ) {
          result[propertyName] =
            deepMerge(
              result[propertyName],
              propertyValue
            );

          return;
        }

        if (
          Array.isArray(
            propertyValue
          )
        ) {
          result[propertyName] =
            propertyValue.slice();

          return;
        }

        result[propertyName] =
          propertyValue;
      }
    );

    return result;
  }

  function escapeHtml(
    value
  ) {
    return safeString(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        "\"",
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  function escapeAttribute(
    value
  ) {
    return escapeHtml(value)
      .replaceAll(
        "`",
        "&#096;"
      );
  }

  function sanitizeUrl(
    value
  ) {
    const candidateUrl =
      safeString(value);

    if (
      !candidateUrl
    ) {
      return "";
    }

    try {
      const parsedUrl =
        new URL(
          candidateUrl,
          windowObject.location.origin
        );

      const allowedProtocols =
        new Set([
          "http:",
          "https:",
          "blob:",
          "data:"
        ]);

      if (
        !allowedProtocols.has(
          parsedUrl.protocol
        )
      ) {
        return "";
      }

      return parsedUrl.href;
    } catch (
      urlError
    ) {
      return "";
    }
  }

  function formatFileSize(
    byteCount,
    decimalPlaces = 1
  ) {
    const resolvedBytes =
      Math.max(
        0,
        safeNumber(
          byteCount,
          0
        )
      );

    if (
      resolvedBytes === 0
    ) {
      return "0 B";
    }

    const measurementUnits =
      [
        "B",
        "KB",
        "MB",
        "GB",
        "TB"
      ];

    const unitIndex =
      Math.min(
        measurementUnits.length - 1,
        Math.floor(
          Math.log(
            resolvedBytes
          ) /
          Math.log(1024)
        )
      );

    const convertedValue =
      resolvedBytes /
      Math.pow(
        1024,
        unitIndex
      );

    return [
      convertedValue.toFixed(
        Math.max(
          0,
          safeInteger(
            decimalPlaces,
            1
          )
        )
      ),
      measurementUnits[unitIndex]
    ].join(" ");
  }

  function formatCompactNumber(
    value
  ) {
    const resolvedValue =
      safeNumber(
        value,
        0
      );

    try {
      return new Intl.NumberFormat(
        undefined,
        {
          notation:
            "compact",

          maximumFractionDigits:
            1
        }
      ).format(
        resolvedValue
      );
    } catch (
      formattingError
    ) {
      return String(
        resolvedValue
      );
    }
  }

  function formatDate(
    value,
    options = {}
  ) {
    if (
      !value
    ) {
      return "Unknown date";
    }

    const dateValue =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      Number.isNaN(
        dateValue.getTime()
      )
    ) {
      return "Unknown date";
    }

    const defaultOptions = {
      year:
        "numeric",

      month:
        "short",

      day:
        "numeric"
    };

    try {
      return new Intl.DateTimeFormat(
        undefined,
        {
          ...defaultOptions,
          ...options
        }
      ).format(
        dateValue
      );
    } catch (
      formattingError
    ) {
      return dateValue
        .toISOString()
        .slice(
          0,
          10
        );
    }
  }

  function formatRelativeDate(
    value
  ) {
    if (
      !value
    ) {
      return "Unknown date";
    }

    const dateValue =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      Number.isNaN(
        dateValue.getTime()
      )
    ) {
      return "Unknown date";
    }

    const differenceMilliseconds =
      dateValue.getTime() -
      Date.now();

    const absoluteDifference =
      Math.abs(
        differenceMilliseconds
      );

    const units = [
      {
        name:
          "year",

        milliseconds:
          365 * 24 * 60 * 60 * 1000
      },
      {
        name:
          "month",

        milliseconds:
          30 * 24 * 60 * 60 * 1000
      },
      {
        name:
          "week",

        milliseconds:
          7 * 24 * 60 * 60 * 1000
      },
      {
        name:
          "day",

        milliseconds:
          24 * 60 * 60 * 1000
      },
      {
        name:
          "hour",

        milliseconds:
          60 * 60 * 1000
      },
      {
        name:
          "minute",

        milliseconds:
          60 * 1000
      }
    ];

    const matchedUnit =
      units.find(
        unit =>
          absoluteDifference >=
          unit.milliseconds
      );

    if (
      !matchedUnit
    ) {
      return "just now";
    }

    const relativeValue =
      Math.round(
        differenceMilliseconds /
        matchedUnit.milliseconds
      );

    try {
      return new Intl.RelativeTimeFormat(
        undefined,
        {
          numeric:
            "auto"
        }
      ).format(
        relativeValue,
        matchedUnit.name
      );
    } catch (
      formattingError
    ) {
      return formatDate(
        dateValue
      );
    }
  }

  function getFileExtension(
    fileName
  ) {
    const normalizedName =
      safeString(fileName)
        .toLowerCase();

    const lastPeriodIndex =
      normalizedName.lastIndexOf(
        "."
      );

    if (
      lastPeriodIndex < 0 ||
      lastPeriodIndex ===
      normalizedName.length - 1
    ) {
      return "";
    }

    return normalizedName.slice(
      lastPeriodIndex + 1
    );
  }

  function detectMediaType(
    input
  ) {
    const mimeType =
      safeString(
        input?.mimeType ||
        input?.type
      )
        .toLowerCase();

    const fileName =
      safeString(
        input?.fileName ||
        input?.originalName ||
        input?.name ||
        input?.title
      );

    const extension =
      getFileExtension(
        fileName
      );

    if (
      mimeType.startsWith(
        "image/"
      )
    ) {
      return "image";
    }

    if (
      mimeType.startsWith(
        "video/"
      )
    ) {
      return "video";
    }

    if (
      mimeType.startsWith(
        "audio/"
      )
    ) {
      return "audio";
    }

    if (
      mimeType ===
      "application/pdf" ||
      extension ===
      "pdf"
    ) {
      return "pdf";
    }

    if (
      [
        "ppt",
        "pptx",
        "key",
        "odp"
      ].includes(
        extension
      )
    ) {
      return "presentation";
    }

    if (
      [
        "xls",
        "xlsx",
        "csv",
        "ods"
      ].includes(
        extension
      )
    ) {
      return "spreadsheet";
    }

    if (
      [
        "doc",
        "docx",
        "txt",
        "rtf",
        "odt"
      ].includes(
        extension
      )
    ) {
      return "document";
    }

    if (
      [
        "zip",
        "rar",
        "7z",
        "tar",
        "gz"
      ].includes(
        extension
      )
    ) {
      return "archive";
    }

    return safeString(
      input?.mediaType ||
      input?.resourceType ||
      "other"
    )
      .toLowerCase();
  }

  function normalizeMediaItem(
    mediaItem
  ) {
    const source =
      isObject(mediaItem)
        ? mediaItem
        : {};

    const id =
      safeString(
        source.id ||
        source._id
      );

    const fileName =
      safeString(
        source.fileName ||
        source.originalName ||
        source.name ||
        source.title,
        "Untitled media"
      );

    const mediaUrl =
      sanitizeUrl(
        source.secureUrl ||
        source.url ||
        source.fileUrl ||
        source.mediaUrl
      );

    const thumbnailUrl =
      sanitizeUrl(
        source.thumbnailUrl ||
        source.previewUrl ||
        source.posterUrl ||
        mediaUrl
      );

    return {
      ...source,

      id,

      _id:
        safeString(
          source._id ||
          id
        ),

      name:
        fileName,

      fileName,

      title:
        safeString(
          source.title ||
          fileName,
          "Untitled media"
        ),

      description:
        safeString(
          source.description
        ),

      url:
        mediaUrl,

      secureUrl:
        mediaUrl,

      thumbnailUrl,

      mimeType:
        safeString(
          source.mimeType ||
          source.type
        ),

      mediaType:
        detectMediaType(
          source
        ),

      size:
        Math.max(
          0,
          safeNumber(
            source.size ||
            source.bytes ||
            source.fileSize,
            0
          )
        ),

      folderId:
        safeString(
          source.folderId?._id ||
          source.folderId ||
          source.folder?._id ||
          source.folder?.id
        ),

      isFavorite:
        normalizeBoolean(
          source.isFavorite ||
          source.favorite
        ),

      isDeleted:
        normalizeBoolean(
          source.isDeleted ||
          source.deleted
        ),

      usageCount:
        Math.max(
          0,
          safeInteger(
            source.usageCount ||
            source.usesCount ||
            source.referencesCount,
            0
          )
        ),

      downloadsCount:
        Math.max(
          0,
          safeInteger(
            source.downloadsCount ||
            source.downloadCount,
            0
          )
        ),

      createdAt:
        source.createdAt ||
        source.uploadedAt ||
        null,

      updatedAt:
        source.updatedAt ||
        source.createdAt ||
        null
    };
  }

  function normalizeFolder(
    folder
  ) {
    const source =
      isObject(folder)
        ? folder
        : {};

    const id =
      safeString(
        source.id ||
        source._id
      );

    return {
      ...source,

      id,

      _id:
        safeString(
          source._id ||
          id
        ),

      name:
        safeString(
          source.name,
          "Untitled folder"
        ),

      parentFolderId:
        safeString(
          source.parentFolderId?._id ||
          source.parentFolderId
        ),

      itemCount:
        Math.max(
          0,
          safeInteger(
            source.itemCount ||
            source.mediaCount ||
            source.count,
            0
          )
        ),

      isDeleted:
        normalizeBoolean(
          source.isDeleted
        ),

      createdAt:
        source.createdAt ||
        null,

      updatedAt:
        source.updatedAt ||
        source.createdAt ||
        null
    };
  }

  /* =========================================================
     LOCAL STORAGE UTILITIES
  ========================================================= */

  function createStorageKey(
    propertyName
  ) {
    return [
      STORAGE_PREFIX,
      safeString(
        propertyName
      )
    ].join(".");
  }

  function readStorageValue(
    propertyName,
    fallbackValue = null
  ) {
    try {
      const storageValue =
        windowObject.localStorage
          .getItem(
            createStorageKey(
              propertyName
            )
          );

      if (
        storageValue === null
      ) {
        return fallbackValue;
      }

      return JSON.parse(
        storageValue
      );
    } catch (
      storageError
    ) {
      console.warn(
        "[AIFT Media Library] Could not read local preference:",
        propertyName,
        storageError
      );

      return fallbackValue;
    }
  }

  function writeStorageValue(
    propertyName,
    value
  ) {
    try {
      windowObject.localStorage
        .setItem(
          createStorageKey(
            propertyName
          ),
          JSON.stringify(value)
        );

      return true;
    } catch (
      storageError
    ) {
      console.warn(
        "[AIFT Media Library] Could not save local preference:",
        propertyName,
        storageError
      );

      return false;
    }
  }

  function removeStorageValue(
    propertyName
  ) {
    try {
      windowObject.localStorage
        .removeItem(
          createStorageKey(
            propertyName
          )
        );

      return true;
    } catch (
      storageError
    ) {
      console.warn(
        "[AIFT Media Library] Could not remove local preference:",
        propertyName,
        storageError
      );

      return false;
    }
  }

  /* =========================================================
     EVENT BUS
  ========================================================= */

  class MediaEventBus {
    constructor() {
      this.listeners =
        new Map();
    }

    on(
      eventName,
      callback
    ) {
      const normalizedEventName =
        safeString(eventName);

      if (
        !normalizedEventName
      ) {
        throw new Error(
          "An event name is required."
        );
      }

      if (
        !isFunction(callback)
      ) {
        throw new TypeError(
          "The event callback must be a function."
        );
      }

      if (
        !this.listeners.has(
          normalizedEventName
        )
      ) {
        this.listeners.set(
          normalizedEventName,
          new Set()
        );
      }

      this.listeners
        .get(
          normalizedEventName
        )
        .add(
          callback
        );

      return () => {
        this.off(
          normalizedEventName,
          callback
        );
      };
    }

    once(
      eventName,
      callback
    ) {
      if (
        !isFunction(callback)
      ) {
        throw new TypeError(
          "The event callback must be a function."
        );
      }

      const removeListener =
        this.on(
          eventName,
          eventPayload => {
            removeListener();

            callback(
              eventPayload
            );
          }
        );

      return removeListener;
    }

    off(
      eventName,
      callback
    ) {
      const normalizedEventName =
        safeString(eventName);

      const eventListeners =
        this.listeners.get(
          normalizedEventName
        );

      if (
        !eventListeners
      ) {
        return false;
      }

      const wasDeleted =
        eventListeners.delete(
          callback
        );

      if (
        eventListeners.size === 0
      ) {
        this.listeners.delete(
          normalizedEventName
        );
      }

      return wasDeleted;
    }

    emit(
      eventName,
      payload = {}
    ) {
      const normalizedEventName =
        safeString(eventName);

      const eventListeners =
        this.listeners.get(
          normalizedEventName
        );

      const eventPayload = {
        eventName:
          normalizedEventName,

        timestamp:
          new Date().toISOString(),

        ...(
          isObject(payload)
            ? payload
            : {
                value:
                  payload
              }
        )
      };

      if (
        eventListeners
      ) {
        Array.from(
          eventListeners
        ).forEach(
          callback => {
            try {
              callback(
                eventPayload
              );
            } catch (
              callbackError
            ) {
              console.error(
                `[AIFT Media Library] Event listener failed for "${normalizedEventName}":`,
                callbackError
              );
            }
          }
        );
      }

      try {
        documentObject.dispatchEvent(
          new CustomEvent(
            normalizedEventName,
            {
              detail:
                eventPayload
            }
          )
        );
      } catch (
        customEventError
      ) {
        console.warn(
          "[AIFT Media Library] Could not dispatch DOM event:",
          customEventError
        );
      }

      return eventPayload;
    }

    clear(
      eventName = ""
    ) {
      const normalizedEventName =
        safeString(eventName);

      if (
        normalizedEventName
      ) {
        this.listeners.delete(
          normalizedEventName
        );

        return;
      }

      this.listeners.clear();
    }
  }

  /* =========================================================
     STATE STORE
  ========================================================= */

  class MediaStateStore {
    constructor(
      initialState,
      eventBus
    ) {
      this.state =
        deepClone(
          initialState
        );

      this.eventBus =
        eventBus;

      this.subscribers =
        new Set();

      this.version =
        0;
    }

    getState() {
      return deepClone(
        this.state
      );
    }

    getUnsafeState() {
      return this.state;
    }

    get(
      propertyName,
      fallbackValue = undefined
    ) {
      if (
        !propertyName
      ) {
        return fallbackValue;
      }

      const pathSegments =
        safeString(
          propertyName
        )
          .split(".")
          .filter(Boolean);

      let currentValue =
        this.state;

      for (
        const pathSegment
        of pathSegments
      ) {
        if (
          currentValue === null ||
          currentValue === undefined ||
          !Object.prototype
            .hasOwnProperty
            .call(
              currentValue,
              pathSegment
            )
        ) {
          return fallbackValue;
        }

        currentValue =
          currentValue[
            pathSegment
          ];
      }

      return currentValue;
    }

    setState(
      updater,
      metadata = {}
    ) {
      const previousState =
        this.state;

      let statePatch;

      if (
        isFunction(updater)
      ) {
        statePatch =
          updater(
            deepClone(
              previousState
            )
          );
      } else {
        statePatch =
          updater;
      }

      if (
        !isObject(statePatch)
      ) {
        throw new TypeError(
          "State updates must return an object."
        );
      }

      const nextState =
        deepMerge(
          previousState,
          statePatch
        );

      this.state =
        nextState;

      this.version +=
        1;

      const changeRecord = {
        version:
          this.version,

        previousState:
          deepClone(
            previousState
          ),

        nextState:
          deepClone(
            nextState
          ),

        metadata:
          isObject(metadata)
            ? metadata
            : {}
      };

      this.subscribers
        .forEach(
          subscriber => {
            try {
              subscriber(
                changeRecord
              );
            } catch (
              subscriberError
            ) {
              console.error(
                "[AIFT Media Library] State subscriber failed:",
                subscriberError
              );
            }
          }
        );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.STATE_CHANGED,
        changeRecord
      );

      return this.getState();
    }

    replaceState(
      replacementState,
      metadata = {}
    ) {
      if (
        !isObject(
          replacementState
        )
      ) {
        throw new TypeError(
          "The replacement state must be an object."
        );
      }

      const previousState =
        this.state;

      this.state =
        deepClone(
          replacementState
        );

      this.version +=
        1;

      const changeRecord = {
        version:
          this.version,

        previousState:
          deepClone(
            previousState
          ),

        nextState:
          deepClone(
            this.state
          ),

        metadata:
          isObject(metadata)
            ? metadata
            : {}
      };

      this.subscribers
        .forEach(
          subscriber => {
            try {
              subscriber(
                changeRecord
              );
            } catch (
              subscriberError
            ) {
              console.error(
                "[AIFT Media Library] State subscriber failed:",
                subscriberError
              );
            }
          }
        );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.STATE_CHANGED,
        changeRecord
      );

      return this.getState();
    }

    subscribe(
      subscriber
    ) {
      if (
        !isFunction(
          subscriber
        )
      ) {
        throw new TypeError(
          "The state subscriber must be a function."
        );
      }

      this.subscribers.add(
        subscriber
      );

      return () => {
        this.subscribers.delete(
          subscriber
        );
      };
    }

    clearSubscribers() {
      this.subscribers.clear();
    }
  }

  /* =========================================================
     ERROR TYPES
  ========================================================= */

  class MediaLibraryError extends Error {
    constructor(
      message,
      options = {}
    ) {
      super(
        safeString(
          message,
          "A media library error occurred."
        )
      );

      this.name =
        "MediaLibraryError";

      this.code =
        safeString(
          options.code,
          "MEDIA_LIBRARY_ERROR"
        );

      this.status =
        safeInteger(
          options.status,
          0
        );

      this.details =
        options.details ||
        null;

      this.response =
        options.response ||
        null;

      this.originalError =
        options.originalError ||
        null;

      this.isNetworkError =
        normalizeBoolean(
          options.isNetworkError
        );

      this.isAuthenticationError =
        normalizeBoolean(
          options.isAuthenticationError
        );

      this.isAuthorizationError =
        normalizeBoolean(
          options.isAuthorizationError
        );

      this.isTimeoutError =
        normalizeBoolean(
          options.isTimeoutError
        );

      this.isAbortError =
        normalizeBoolean(
          options.isAbortError
        );
    }
  }

  function normalizeError(
    error,
    fallbackMessage =
      "The request could not be completed."
  ) {
    if (
      error instanceof
      MediaLibraryError
    ) {
      return error;
    }

    const errorName =
      safeString(
        error?.name
      );

    const isAbortError =
      errorName ===
      "AbortError";

    const isTimeoutError =
      errorName ===
      "TimeoutError";

    const isNetworkError =
      error instanceof TypeError &&
      /fetch|network|failed/i.test(
        safeString(
          error.message
        )
      );

    return new MediaLibraryError(
      safeString(
        error?.message,
        fallbackMessage
      ),
      {
        code:
          isAbortError
            ? "REQUEST_ABORTED"
            : isTimeoutError
              ? "REQUEST_TIMEOUT"
              : isNetworkError
                ? "NETWORK_ERROR"
                : "UNEXPECTED_ERROR",

        originalError:
          error,

        isAbortError,

        isTimeoutError,

        isNetworkError
      }
    );
  }

  /* =========================================================
     AUTHENTICATION MANAGER
  ========================================================= */

  class MediaAuthenticationManager {
    constructor(
      options = {}
    ) {
      this.tokenKeys =
        uniqueArray(
          options.tokenKeys || [
            "token",
            "authToken",
            "aiftToken",
            "accessToken"
          ]
        );

      this.customTokenProvider =
        isFunction(
          options.tokenProvider
        )
          ? options.tokenProvider
          : null;
    }

    getToken() {
      if (
        this.customTokenProvider
      ) {
        try {
          const customToken =
            safeString(
              this.customTokenProvider()
            );

          if (
            customToken
          ) {
            return customToken;
          }
        } catch (
          tokenProviderError
        ) {
          console.warn(
            "[AIFT Media Library] Custom token provider failed:",
            tokenProviderError
          );
        }
      }

      for (
        const tokenKey
        of this.tokenKeys
      ) {
        try {
          const localStorageToken =
            safeString(
              windowObject.localStorage
                .getItem(
                  tokenKey
                )
            );

          if (
            localStorageToken
          ) {
            return localStorageToken;
          }
        } catch (
          localStorageError
        ) {
          console.warn(
            "[AIFT Media Library] Local storage token lookup failed:",
            localStorageError
          );
        }

        try {
          const sessionStorageToken =
            safeString(
              windowObject.sessionStorage
                .getItem(
                  tokenKey
                )
            );

          if (
            sessionStorageToken
          ) {
            return sessionStorageToken;
          }
        } catch (
          sessionStorageError
        ) {
          console.warn(
            "[AIFT Media Library] Session storage token lookup failed:",
            sessionStorageError
          );
        }
      }

      return "";
    }

    hasToken() {
      return Boolean(
        this.getToken()
      );
    }

    createHeaders(
      additionalHeaders = {}
    ) {
      const token =
        this.getToken();

      const headers =
        new Headers(
          additionalHeaders
        );

      if (
        token &&
        !headers.has(
          "Authorization"
        )
      ) {
        headers.set(
          "Authorization",
          `Bearer ${token}`
        );
      }

      if (
        !headers.has(
          "Accept"
        )
      ) {
        headers.set(
          "Accept",
          "application/json"
        );
      }

      return headers;
    }
  }

  /* =========================================================
     API CLIENT
  ========================================================= */

  class MediaApiClient {
    constructor(
      configuration,
      authenticationManager,
      eventBus
    ) {
      this.configuration =
        configuration;

      this.authenticationManager =
        authenticationManager;

      this.eventBus =
        eventBus;

      this.activeRequests =
        new Map();
    }

    resolveUrl(
      path,
      queryParameters = {}
    ) {
      const normalizedPath =
        safeString(path);

      const baseUrl =
        safeString(
          this.configuration.apiBaseUrl,
          DEFAULT_API_BASE_URL
        )
          .replace(
            /\/+$/,
            ""
          );

      const resolvedPath =
        normalizedPath.startsWith(
          "/"
        )
          ? normalizedPath
          : `/${normalizedPath}`;

      const url =
        new URL(
          `${baseUrl}${resolvedPath}`
        );

      Object.entries(
        queryParameters || {}
      ).forEach(
        ([
          propertyName,
          propertyValue
        ]) => {
          if (
            propertyValue === undefined ||
            propertyValue === null ||
            propertyValue === ""
          ) {
            return;
          }

          if (
            Array.isArray(
              propertyValue
            )
          ) {
            propertyValue.forEach(
              arrayValue => {
                url.searchParams.append(
                  propertyName,
                  String(arrayValue)
                );
              }
            );

            return;
          }

          url.searchParams.set(
            propertyName,
            String(propertyValue)
          );
        }
      );

      return url.toString();
    }

    createRequestKey(
      method,
      url
    ) {
      return [
        safeString(
          method,
          "GET"
        ).toUpperCase(),
        safeString(url)
      ].join(":");
    }

    cancelRequest(
      requestKey
    ) {
      const activeRequest =
        this.activeRequests.get(
          requestKey
        );

      if (
        !activeRequest
      ) {
        return false;
      }

      activeRequest.controller.abort(
        new DOMException(
          "The request was cancelled.",
          "AbortError"
        )
      );

      this.activeRequests.delete(
        requestKey
      );

      return true;
    }

    cancelAllRequests() {
      Array.from(
        this.activeRequests.keys()
      ).forEach(
        requestKey => {
          this.cancelRequest(
            requestKey
          );
        }
      );
    }

    async request(
      path,
      options = {}
    ) {
      const method =
        safeString(
          options.method,
          "GET"
        ).toUpperCase();

      const url =
        this.resolveUrl(
          path,
          options.query
        );

      const requestKey =
        safeString(
          options.requestKey,
          this.createRequestKey(
            method,
            url
          )
        );

      if (
        normalizeBoolean(
          options.cancelPrevious,
          method === "GET"
        )
      ) {
        this.cancelRequest(
          requestKey
        );
      }

      const internalController =
        new AbortController();

      const timeoutMilliseconds =
        clampNumber(
          options.timeoutMilliseconds ??
          DEFAULT_REQUEST_TIMEOUT_MS,
          1000,
          600000
        );

      let timeoutId =
        null;

      let externalAbortHandler =
        null;

      if (
        options.signal
      ) {
        if (
          options.signal.aborted
        ) {
          internalController.abort(
            options.signal.reason
          );
        } else {
          externalAbortHandler =
            () => {
              internalController.abort(
                options.signal.reason
              );
            };

          options.signal.addEventListener(
            "abort",
            externalAbortHandler,
            {
              once:
                true
            }
          );
        }
      }

      timeoutId =
        windowObject.setTimeout(
          () => {
            internalController.abort(
              new DOMException(
                `The request exceeded ${timeoutMilliseconds} milliseconds.`,
                "TimeoutError"
              )
            );
          },
          timeoutMilliseconds
        );

      this.activeRequests.set(
        requestKey,
        {
          controller:
            internalController,

          method,

          url,

          startedAt:
            Date.now()
        }
      );

      const headers =
        this.authenticationManager
          .createHeaders(
            options.headers
          );

      let body =
        options.body;

      if (
        isObject(body) &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer)
      ) {
        if (
          !headers.has(
            "Content-Type"
          )
        ) {
          headers.set(
            "Content-Type",
            "application/json"
          );
        }

        body =
          JSON.stringify(
            body
          );
      }

      const requestMetadata = {
        requestKey,

        method,

        url,

        startedAt:
          new Date().toISOString()
      };

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.REQUEST_STARTED,
        requestMetadata
      );

      try {
        const response =
          await windowObject.fetch(
            url,
            {
              method,

              headers,

              body:
                method === "GET" ||
                method === "HEAD"
                  ? undefined
                  : body,

              signal:
                internalController.signal,

              credentials:
                options.credentials ||
                "same-origin",

              cache:
                options.cache ||
                "no-store",

              redirect:
                "follow"
            }
          );

        const responseContentType =
          safeString(
            response.headers.get(
              "content-type"
            )
          ).toLowerCase();

        let responsePayload =
          null;

        if (
          response.status !== 204
        ) {
          if (
            responseContentType.includes(
              "application/json"
            )
          ) {
            try {
              responsePayload =
                await response.json();
            } catch (
              responseParsingError
            ) {
              responsePayload =
                null;
            }
          } else {
            try {
              responsePayload =
                await response.text();
            } catch (
              responseParsingError
            ) {
              responsePayload =
                null;
            }
          }
        }

        if (
          !response.ok
        ) {
          const responseMessage =
            safeString(
              responsePayload?.message ||
              responsePayload?.error ||
              responsePayload,
              `Request failed with status ${response.status}.`
            );

          const requestError =
            new MediaLibraryError(
              responseMessage,
              {
                code:
                  safeString(
                    responsePayload?.code,
                    `HTTP_${response.status}`
                  ),

                status:
                  response.status,

                details:
                  responsePayload?.details ||
                  responsePayload?.errors ||
                  null,

                response:
                  responsePayload,

                isAuthenticationError:
                  response.status === 401,

                isAuthorizationError:
                  response.status === 403
              }
            );

          if (
            response.status === 401
          ) {
            this.eventBus.emit(
              MEDIA_LIBRARY_EVENTS.AUTHENTICATION_REQUIRED,
              {
                error:
                  requestError
              }
            );
          }

          throw requestError;
        }

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.REQUEST_FINISHED,
          {
            ...requestMetadata,

            status:
              response.status,

            durationMilliseconds:
              Date.now() -
              this.activeRequests
                .get(
                  requestKey
                )?.startedAt
          }
        );

        return responsePayload;
      } catch (
        requestError
      ) {
        const normalizedRequestError =
          normalizeError(
            requestError
          );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.REQUEST_FAILED,
          {
            ...requestMetadata,

            error:
              normalizedRequestError
          }
        );

        throw normalizedRequestError;
      } finally {
        if (
          timeoutId !== null
        ) {
          windowObject.clearTimeout(
            timeoutId
          );
        }

        if (
          options.signal &&
          externalAbortHandler
        ) {
          options.signal
            .removeEventListener(
              "abort",
              externalAbortHandler
            );
        }

        this.activeRequests.delete(
          requestKey
        );
      }
    }

    get(
      path,
      options = {}
    ) {
      return this.request(
        path,
        {
          ...options,

          method:
            "GET"
        }
      );
    }

    post(
      path,
      body,
      options = {}
    ) {
      return this.request(
        path,
        {
          ...options,

          method:
            "POST",

          body
        }
      );
    }

    patch(
      path,
      body,
      options = {}
    ) {
      return this.request(
        path,
        {
          ...options,

          method:
            "PATCH",

          body
        }
      );
    }

    put(
      path,
      body,
      options = {}
    ) {
      return this.request(
        path,
        {
          ...options,

          method:
            "PUT",

          body
        }
      );
    }

    delete(
      path,
      options = {}
    ) {
      return this.request(
        path,
        {
          ...options,

          method:
            "DELETE"
        }
      );
    }
  }

  /* =========================================================
     DOM REGISTRY
  ========================================================= */

  class MediaDomRegistry {
    constructor(
      candidateMap
    ) {
      this.candidateMap =
        candidateMap;

      this.elements =
        {};
    }

    findByCandidateIds(
      candidateIds
    ) {
      for (
        const candidateId
        of normalizeArray(
          candidateIds
        )
      ) {
        const element =
          documentObject.getElementById(
            candidateId
          );

        if (
          element
        ) {
          return element;
        }
      }

      return null;
    }

    refresh() {
      const nextElements =
        {};

      Object.entries(
        this.candidateMap
      ).forEach(
        ([
          propertyName,
          candidateIds
        ]) => {
          nextElements[propertyName] =
            this.findByCandidateIds(
              candidateIds
            );
        }
      );

      this.elements =
        nextElements;

      return this.elements;
    }

    get(
      propertyName
    ) {
      return (
        this.elements[
          propertyName
        ] ||
        null
      );
    }

    has(
      propertyName
    ) {
      return Boolean(
        this.get(
          propertyName
        )
      );
    }

    require(
      propertyName
    ) {
      const element =
        this.get(
          propertyName
        );

      if (
        !element
      ) {
        throw new MediaLibraryError(
          `The required media library element "${propertyName}" could not be found.`,
          {
            code:
              "MEDIA_DOM_ELEMENT_MISSING",

            details: {
              propertyName,

              candidateIds:
                this.candidateMap[
                  propertyName
                ] || []
            }
          }
        );
      }

      return element;
    }
  }

  /* =========================================================
     NOTIFICATION MANAGER
  ========================================================= */

  class MediaNotificationManager {
    constructor(
      eventBus
    ) {
      this.eventBus =
        eventBus;

      this.container =
        null;
    }

    ensureContainer() {
      if (
        this.container &&
        this.container.isConnected
      ) {
        return this.container;
      }

      const existingContainer =
        documentObject.getElementById(
          "aiftMediaNotificationContainer"
        );

      if (
        existingContainer
      ) {
        this.container =
          existingContainer;

        return existingContainer;
      }

      const notificationContainer =
        documentObject.createElement(
          "div"
        );

      notificationContainer.id =
        "aiftMediaNotificationContainer";

      notificationContainer.setAttribute(
        "aria-live",
        "polite"
      );

      notificationContainer.setAttribute(
        "aria-atomic",
        "false"
      );

      Object.assign(
        notificationContainer.style,
        {
          position:
            "fixed",

          top:
            "18px",

          right:
            "18px",

          zIndex:
            "20000",

          width:
            "min(390px, calc(100vw - 36px))",

          display:
            "grid",

          gap:
            "10px",

          pointerEvents:
            "none"
        }
      );

      documentObject.body.appendChild(
        notificationContainer
      );

      this.container =
        notificationContainer;

      return notificationContainer;
    }

    show(
      message,
      options = {}
    ) {
      const normalizedMessage =
        safeString(message);

      if (
        !normalizedMessage
      ) {
        return null;
      }

      const notificationType =
        safeString(
          options.type,
          "info"
        ).toLowerCase();

      const durationMilliseconds =
        clampNumber(
          options.durationMilliseconds ??
          4500,
          1000,
          30000
        );

      const notificationId =
        safeString(
          options.id,
          createId(
            "media-notification"
          )
        );

      const notificationContainer =
        this.ensureContainer();

      const notification =
        documentObject.createElement(
          "div"
        );

      notification.id =
        notificationId;

      notification.setAttribute(
        "role",
        notificationType ===
        "error"
          ? "alert"
          : "status"
      );

      const typeStyles = {
        info: {
          borderColor:
            "#aecbfa",

          iconBackground:
            "#e8f0fe",

          iconColor:
            "#1a73e8",

          iconText:
            "i"
        },

        success: {
          borderColor:
            "#b7dfc6",

          iconBackground:
            "#e6f4ea",

          iconColor:
            "#188038",

          iconText:
            "✓"
        },

        warning: {
          borderColor:
            "#f6d58d",

          iconBackground:
            "#fef7e0",

          iconColor:
            "#b06000",

          iconText:
            "!"
        },

        error: {
          borderColor:
            "#f1b8b6",

          iconBackground:
            "#fce8e6",

          iconColor:
            "#d93025",

          iconText:
            "!"
        }
      };

      const selectedStyle =
        typeStyles[
          notificationType
        ] ||
        typeStyles.info;

      Object.assign(
        notification.style,
        {
          display:
            "grid",

          gridTemplateColumns:
            "34px minmax(0, 1fr) 28px",

          alignItems:
            "start",

          gap:
            "10px",

          padding:
            "12px",

          border:
            `1px solid ${selectedStyle.borderColor}`,

          borderRadius:
            "10px",

          background:
            "#ffffff",

          color:
            "#202124",

          boxShadow:
            "0 10px 32px rgba(32, 33, 36, 0.18)",

          pointerEvents:
            "auto",

          opacity:
            "0",

          transform:
            "translateY(-8px)",

          transition:
            "opacity 160ms ease, transform 160ms ease"
        }
      );

      const icon =
        documentObject.createElement(
          "span"
        );

      icon.textContent =
        selectedStyle.iconText;

      Object.assign(
        icon.style,
        {
          width:
            "34px",

          height:
            "34px",

          display:
            "grid",

          placeItems:
            "center",

          borderRadius:
            "50%",

          background:
            selectedStyle.iconBackground,

          color:
            selectedStyle.iconColor,

          fontSize:
            "14px",

          fontWeight:
            "800"
        }
      );

      const content =
        documentObject.createElement(
          "div"
        );

      const title =
        documentObject.createElement(
          "strong"
        );

      title.textContent =
        safeString(
          options.title,
          notificationType ===
          "error"
            ? "Something went wrong"
            : notificationType ===
              "success"
              ? "Completed"
              : notificationType ===
                "warning"
                ? "Attention"
                : APPLICATION_NAME
        );

      Object.assign(
        title.style,
        {
          display:
            "block",

          margin:
            "1px 0 3px",

          fontSize:
            "12px",

          lineHeight:
            "1.4",

          fontWeight:
            "700"
        }
      );

      const description =
        documentObject.createElement(
          "p"
        );

      description.textContent =
        normalizedMessage;

      Object.assign(
        description.style,
        {
          margin:
            "0",

          color:
            "#5f6368",

          fontSize:
            "10px",

          lineHeight:
            "1.55"
        }
      );

      content.append(
        title,
        description
      );

      const closeButton =
        documentObject.createElement(
          "button"
        );

      closeButton.type =
        "button";

      closeButton.setAttribute(
        "aria-label",
        "Dismiss notification"
      );

      closeButton.textContent =
        "×";

      Object.assign(
        closeButton.style,
        {
          width:
            "28px",

          height:
            "28px",

          padding:
            "0",

          border:
            "0",

          borderRadius:
            "50%",

          background:
            "transparent",

          color:
            "#5f6368",

          fontSize:
            "20px",

          lineHeight:
            "1",

          cursor:
            "pointer"
        }
      );

      let removalTimerId =
        null;

      const removeNotification =
        () => {
          if (
            removalTimerId !== null
          ) {
            windowObject.clearTimeout(
              removalTimerId
            );

            removalTimerId =
              null;
          }

          notification.style.opacity =
            "0";

          notification.style.transform =
            "translateY(-8px)";

          windowObject.setTimeout(
            () => {
              notification.remove();
            },
            180
          );
        };

      closeButton.addEventListener(
        "click",
        removeNotification
      );

      notification.append(
        icon,
        content,
        closeButton
      );

      notificationContainer.appendChild(
        notification
      );

      windowObject.requestAnimationFrame(
        () => {
          notification.style.opacity =
            "1";

          notification.style.transform =
            "translateY(0)";
        }
      );

      if (
        !normalizeBoolean(
          options.persistent
        )
      ) {
        removalTimerId =
          windowObject.setTimeout(
            removeNotification,
            durationMilliseconds
          );
      }

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.NOTIFICATION,
        {
          id:
            notificationId,

          type:
            notificationType,

          message:
            normalizedMessage
        }
      );

      return {
        id:
          notificationId,

        element:
          notification,

        remove:
          removeNotification
      };
    }

    success(
      message,
      options = {}
    ) {
      return this.show(
        message,
        {
          ...options,

          type:
            "success"
        }
      );
    }

    warning(
      message,
      options = {}
    ) {
      return this.show(
        message,
        {
          ...options,

          type:
            "warning"
        }
      );
    }

    error(
      message,
      options = {}
    ) {
      return this.show(
        message,
        {
          ...options,

          type:
            "error"
        }
      );
    }

    info(
      message,
      options = {}
    ) {
      return this.show(
        message,
        {
          ...options,

          type:
            "info"
        }
      );
    }
  }

  /* =========================================================
     CONFIGURATION
  ========================================================= */

  function detectClassId() {
    const urlParameters =
      new URLSearchParams(
        windowObject.location.search
      );

    const classIdCandidates = [
      urlParameters.get(
        "classId"
      ),

      urlParameters.get(
        "class"
      ),

      documentObject.body
        ?.dataset
        ?.classId,

      documentObject
        .getElementById(
          "section-media"
        )
        ?.dataset
        ?.classId,

      windowObject.currentClassId,

      windowObject.classId,

      windowObject.currentClass?._id,

      windowObject.currentClass?.id,

      windowObject.builderClass?._id,

      windowObject.builderClass?.id
    ];

    for (
      const classIdCandidate
      of classIdCandidates
    ) {
      const normalizedClassId =
        safeString(
          classIdCandidate
        );

      if (
        normalizedClassId
      ) {
        return normalizedClassId;
      }
    }

    return "";
  }

  function detectApiBaseUrl() {
    const configuredApiBaseUrl =
      safeString(
        windowObject.AIFT_API_BASE_URL ||
        windowObject.API_BASE_URL ||
        documentObject.body
          ?.dataset
          ?.apiBaseUrl
      );

    if (
      configuredApiBaseUrl
    ) {
      return configuredApiBaseUrl
        .replace(
          /\/+$/,
          ""
        );
    }

    return DEFAULT_API_BASE_URL;
  }

  function createConfiguration(
    customConfiguration = {}
  ) {
    const storedViewMode =
      safeString(
        readStorageValue(
          "viewMode",
          DEFAULT_VIEW_MODE
        )
      ).toLowerCase();

    const resolvedViewMode =
      SUPPORTED_VIEW_MODES.has(
        storedViewMode
      )
        ? storedViewMode
        : DEFAULT_VIEW_MODE;

    return deepMerge(
      {
        applicationName:
          APPLICATION_NAME,

        applicationVersion:
          APPLICATION_VERSION,

        apiBaseUrl:
          detectApiBaseUrl(),

        endpoints: {
          list:
            "/media",

          upload:
            "/media/upload",

          analytics:
            "/media/analytics",

          duplicates:
            "/media/duplicates",

          folders:
            "/media/folders/list",

          createFolder:
            "/media/folders"
        },

        requestTimeoutMilliseconds:
          DEFAULT_REQUEST_TIMEOUT_MS,

        uploadTimeoutMilliseconds:
          DEFAULT_UPLOAD_TIMEOUT_MS,

        searchDelayMilliseconds:
          DEFAULT_SEARCH_DELAY_MS,

        defaultPageSize:
          DEFAULT_PAGE_SIZE,

        maximumPageSize:
          MAX_PAGE_SIZE,

        defaultViewMode:
          resolvedViewMode,

        autoInitialize:
          true,

        autoLoad:
          true,

        debug:
          false,

        tokenProvider:
          null,

        tokenKeys: [
          "token",
          "authToken",
          "aiftToken",
          "accessToken"
        ]
      },
      customConfiguration
    );
  }

  function createInitialState(
    configuration
  ) {
    return {
      lifecycle: {
        initialized:
          false,

        initializing:
          false,

        destroyed:
          false,

        initializedAt:
          null
      },

      context: {
        classId:
          detectClassId(),

        schoolId:
          "",

        activeFolderId:
          "",

        folderPath:
          []
      },

      library: {
        items:
          [],

        totalItems:
          0,

        page:
          1,

        pageSize:
          clampNumber(
            configuration.defaultPageSize,
            1,
            configuration.maximumPageSize
          ),

        totalPages:
          1,

        hasNextPage:
          false,

        hasPreviousPage:
          false,

        loading:
          false,

        loaded:
          false,

        error:
          null
      },

      folders: {
        items:
          [],

        loading:
          false,

        loaded:
          false,

        error:
          null
      },

      analytics: {
        data:
          null,

        loading:
          false,

        loaded:
          false,

        error:
          null
      },

      filters: {
        scope:
          "all",

        type:
          "all",

        search:
          "",

        sort:
          "newest"
      },

      view: {
        mode:
          configuration.defaultViewMode
      },

      selection: {
        ids:
          [],

        anchorId:
          ""
      },

      uploads: {
        queue:
          [],

        activeCount:
          0,

        completedCount:
          0,

        failedCount:
          0
      },

      network: {
        online:
          windowObject.navigator.onLine,

        activeRequests:
          0
      },

      interface: {
        uploadPanelOpen:
          false,

        previewOpen:
          false,

        contextMenuOpen:
          false
      }
    };
  }

  /* =========================================================
     CORE APPLICATION
  ========================================================= */

  class AiftMediaLibraryCore {
    constructor(
      customConfiguration = {}
    ) {
      this.configuration =
        createConfiguration(
          customConfiguration
        );

      this.eventBus =
        new MediaEventBus();

      this.authenticationManager =
        new MediaAuthenticationManager({
          tokenKeys:
            this.configuration
              .tokenKeys,

          tokenProvider:
            this.configuration
              .tokenProvider
        });

      this.api =
        new MediaApiClient(
          this.configuration,
          this.authenticationManager,
          this.eventBus
        );

      this.dom =
        new MediaDomRegistry(
          DOM_ID_CANDIDATES
        );

      this.notifications =
        new MediaNotificationManager(
          this.eventBus
        );

      this.store =
        new MediaStateStore(
          createInitialState(
            this.configuration
          ),
          this.eventBus
        );

      this.cleanupCallbacks =
        [];

      this.initializationPromise =
        null;

      this.loadPromise =
        null;

      this.boundHandleOnline =
        this.handleOnline
          .bind(this);

      this.boundHandleOffline =
        this.handleOffline
          .bind(this);

      this.boundHandleVisibilityChange =
        this.handleVisibilityChange
          .bind(this);
    }

    log(
      ...values
    ) {
      if (
        !this.configuration.debug
      ) {
        return;
      }

      console.log(
        "[AIFT Media Library]",
        ...values
      );
    }

    registerCleanup(
      cleanupCallback
    ) {
      if (
        !isFunction(
          cleanupCallback
        )
      ) {
        return;
      }

      this.cleanupCallbacks.push(
        cleanupCallback
      );
    }

    handleOnline() {
      this.store.setState(
        {
          network: {
            online:
              true
          }
        },
        {
          reason:
            "browser-online"
        }
      );

      this.notifications.success(
        "Your internet connection has been restored.",
        {
          title:
            "Back online",

          durationMilliseconds:
            3000
        }
      );
    }

    handleOffline() {
      this.store.setState(
        {
          network: {
            online:
              false
          }
        },
        {
          reason:
            "browser-offline"
        }
      );

      this.notifications.warning(
        "Media changes may not be saved until your connection returns.",
        {
          title:
            "You are offline",

          persistent:
            true,

          id:
            "aift-media-offline-notification"
        }
      );
    }

    handleVisibilityChange() {
      if (
        documentObject.visibilityState !==
        "visible"
      ) {
        return;
      }

      this.dom.refresh();
    }

    bindCoreEvents() {
      windowObject.addEventListener(
        "online",
        this.boundHandleOnline
      );

      windowObject.addEventListener(
        "offline",
        this.boundHandleOffline
      );

      documentObject.addEventListener(
        "visibilitychange",
        this.boundHandleVisibilityChange
      );

      this.registerCleanup(
        () => {
          windowObject
            .removeEventListener(
              "online",
              this.boundHandleOnline
            );

          windowObject
            .removeEventListener(
              "offline",
              this.boundHandleOffline
            );

          documentObject
            .removeEventListener(
              "visibilitychange",
              this.boundHandleVisibilityChange
            );
        }
      );
    }

    validateContext() {
      const classId =
        safeString(
          this.store.get(
            "context.classId"
          )
        );

      if (
        !classId
      ) {
        throw new MediaLibraryError(
          "The class ID is missing from the page URL. Open the builder with ?classId=YOUR_CLASS_ID.",
          {
            code:
              "CLASS_ID_MISSING"
          }
        );
      }

      return {
        classId
      };
    }

    async initialize() {
      if (
        this.store.get(
          "lifecycle.initialized"
        )
      ) {
        return this;
      }

      if (
        this.initializationPromise
      ) {
        return this.initializationPromise;
      }

      this.initializationPromise =
        this.performInitialization();

      try {
        return await this
          .initializationPromise;
      } finally {
        this.initializationPromise =
          null;
      }
    }

    async performInitialization() {
      this.store.setState(
        {
          lifecycle: {
            initializing:
              true,

            destroyed:
              false
          }
        },
        {
          reason:
            "initialization-started"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.INITIALIZING,
        {
          version:
            APPLICATION_VERSION
        }
      );

      try {
        this.dom.refresh();

        const sectionElement =
          this.dom.get(
            "section"
          );

        if (
          !sectionElement
        ) {
          throw new MediaLibraryError(
            "The Media Library section could not be found in class-builder.html.",
            {
              code:
                "MEDIA_SECTION_MISSING"
            }
          );
        }

        const detectedClassId =
          detectClassId();

        if (
          detectedClassId
        ) {
          this.store.setState(
            {
              context: {
                classId:
                  detectedClassId
              }
            },
            {
              reason:
                "class-context-detected"
            }
          );
        }

        this.validateContext();

        this.bindCoreEvents();

        this.applyStoredPreferences();

        this.store.setState(
          {
            lifecycle: {
              initialized:
                true,

              initializing:
                false,

              destroyed:
                false,

              initializedAt:
                new Date()
                  .toISOString()
            }
          },
          {
            reason:
              "initialization-completed"
          }
        );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.INITIALIZED,
          {
            version:
              APPLICATION_VERSION,

            classId:
              this.store.get(
                "context.classId"
              )
          }
        );

        this.log(
          "Core initialized.",
          this.store.getState()
        );

        if (
          this.configuration.autoLoad
        ) {
          await this.loadInitialData();
        }

        return this;
      } catch (
        initializationError
      ) {
        const normalizedInitializationError =
          normalizeError(
            initializationError,
            "The Media Library could not be initialized."
          );

        this.store.setState(
          {
            lifecycle: {
              initializing:
                false,

              initialized:
                false
            },

            library: {
              error:
                normalizedInitializationError
            }
          },
          {
            reason:
              "initialization-failed"
          }
        );

        this.notifications.error(
          normalizedInitializationError.message,
          {
            title:
              "Media Library unavailable",

            persistent:
              true
          }
        );

        console.error(
          "[AIFT Media Library] Initialization failed:",
          normalizedInitializationError
        );

        throw normalizedInitializationError;
      }
    }

    applyStoredPreferences() {
      const storedViewMode =
        safeString(
          readStorageValue(
            "viewMode",
            this.configuration
              .defaultViewMode
          )
        ).toLowerCase();

      const resolvedViewMode =
        SUPPORTED_VIEW_MODES.has(
          storedViewMode
        )
          ? storedViewMode
          : DEFAULT_VIEW_MODE;

      const storedPageSize =
        clampNumber(
          readStorageValue(
            "pageSize",
            this.configuration
              .defaultPageSize
          ),
          1,
          this.configuration
            .maximumPageSize
        );

      this.store.setState(
        {
          view: {
            mode:
              resolvedViewMode
          },

          library: {
            pageSize:
              storedPageSize
          }
        },
        {
          reason:
            "stored-preferences-applied"
        }
      );
    }

    createLibraryQuery() {
      const state =
        this.store.getUnsafeState();

      const query = {
        classId:
          state.context.classId,

        page:
          state.library.page,

        limit:
          state.library.pageSize,

        sort:
          state.filters.sort
      };

      if (
        state.filters.search
      ) {
        query.search =
          state.filters.search;
      }

      if (
        state.filters.type !==
        "all"
      ) {
        query.type =
          state.filters.type;
      }

      if (
        state.filters.scope ===
        "favorites"
      ) {
        query.favorite =
          true;
      }

      if (
        state.filters.scope ===
        "trash"
      ) {
        query.deleted =
          true;
      }

      if (
        state.filters.scope ===
        "recent"
      ) {
        query.recent =
          true;
      }

      if (
        state.context.activeFolderId
      ) {
        query.folderId =
          state.context
            .activeFolderId;
      }

      return query;
    }

    normalizeLibraryResponse(
      response
    ) {
      const responseObject =
        isObject(response)
          ? response
          : {};

      const rawItems =
        responseObject.media ||
        responseObject.items ||
        responseObject.results ||
        responseObject.data ||
        [];

      const items =
        normalizeArray(
          rawItems
        )
          .map(
            normalizeMediaItem
          )
          .filter(
            mediaItem =>
              Boolean(
                mediaItem.id
              )
          );

      const paginationSource =
        responseObject.pagination ||
        responseObject.meta ||
        responseObject;

      const totalItems =
        Math.max(
          items.length,
          safeInteger(
            paginationSource.total ||
            paginationSource.totalItems ||
            responseObject.count,
            items.length
          )
        );

      const page =
        Math.max(
          1,
          safeInteger(
            paginationSource.page,
            this.store.get(
              "library.page",
              1
            )
          )
        );

      const pageSize =
        Math.max(
          1,
          safeInteger(
            paginationSource.limit ||
            paginationSource.pageSize,
            this.store.get(
              "library.pageSize",
              DEFAULT_PAGE_SIZE
            )
          )
        );

      const totalPages =
        Math.max(
          1,
          safeInteger(
            paginationSource.pages ||
            paginationSource.totalPages,
            Math.ceil(
              totalItems /
              pageSize
            ) || 1
          )
        );

      return {
        items,

        totalItems,

        page,

        pageSize,

        totalPages,

        hasNextPage:
          normalizeBoolean(
            paginationSource.hasNextPage,
            page <
            totalPages
          ),

        hasPreviousPage:
          normalizeBoolean(
            paginationSource.hasPreviousPage,
            page >
            1
          )
      };
    }

    async loadLibrary(
      options = {}
    ) {
      const context =
        this.validateContext();

      this.store.setState(
        {
          library: {
            loading:
              true,

            error:
              null
          }
        },
        {
          reason:
            "library-load-started"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.LIBRARY_LOADING,
        {
          classId:
            context.classId
        }
      );

      try {
        const response =
          await this.api.get(
            this.configuration
              .endpoints
              .list,
            {
              query:
                this.createLibraryQuery(),

              requestKey:
                "media-library-list",

              cancelPrevious:
                true,

              signal:
                options.signal,

              timeoutMilliseconds:
                this.configuration
                  .requestTimeoutMilliseconds
            }
          );

        const normalizedResponse =
          this.normalizeLibraryResponse(
            response
          );

        this.store.setState(
          {
            library: {
              ...normalizedResponse,

              loading:
                false,

              loaded:
                true,

              error:
                null
            }
          },
          {
            reason:
              "library-load-completed"
          }
        );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.LIBRARY_LOADED,
          normalizedResponse
        );

        return normalizedResponse;
      } catch (
        libraryError
      ) {
        const normalizedLibraryError =
          normalizeError(
            libraryError,
            "The media files could not be loaded."
          );

        if (
          normalizedLibraryError
            .isAbortError
        ) {
          throw normalizedLibraryError;
        }

        this.store.setState(
          {
            library: {
              loading:
                false,

              loaded:
                false,

              error:
                normalizedLibraryError
            }
          },
          {
            reason:
              "library-load-failed"
          }
        );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.LIBRARY_FAILED,
          {
            error:
              normalizedLibraryError
          }
        );

        this.notifications.error(
          normalizedLibraryError.message,
          {
            title:
              "Could not load media"
          }
        );

        throw normalizedLibraryError;
      }
    }

    async loadFolders(
      options = {}
    ) {
      const context =
        this.validateContext();

      this.store.setState(
        {
          folders: {
            loading:
              true,

            error:
              null
          }
        },
        {
          reason:
            "folders-load-started"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.FOLDERS_LOADING,
        {
          classId:
            context.classId
        }
      );

      try {
        const response =
          await this.api.get(
            this.configuration
              .endpoints
              .folders,
            {
              query: {
                classId:
                  context.classId
              },

              requestKey:
                "media-library-folders",

              cancelPrevious:
                true,

              signal:
                options.signal,

              timeoutMilliseconds:
                this.configuration
                  .requestTimeoutMilliseconds
            }
          );

        const folders =
          normalizeArray(
            response?.folders ||
            response?.items ||
            response?.data
          )
            .map(
              normalizeFolder
            )
            .filter(
              folder =>
                Boolean(
                  folder.id
                )
            );

        this.store.setState(
          {
            folders: {
              items:
                folders,

              loading:
                false,

              loaded:
                true,

              error:
                null
            }
          },
          {
            reason:
              "folders-load-completed"
          }
        );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.FOLDERS_LOADED,
          {
            folders
          }
        );

        return folders;
      } catch (
        foldersError
      ) {
        const normalizedFoldersError =
          normalizeError(
            foldersError,
            "The media folders could not be loaded."
          );

        if (
          normalizedFoldersError
            .isAbortError
        ) {
          throw normalizedFoldersError;
        }

        this.store.setState(
          {
            folders: {
              loading:
                false,

              loaded:
                false,

              error:
                normalizedFoldersError
            }
          },
          {
            reason:
              "folders-load-failed"
          }
        );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.FOLDERS_FAILED,
          {
            error:
              normalizedFoldersError
          }
        );

        throw normalizedFoldersError;
      }
    }

    async loadAnalytics(
      options = {}
    ) {
      const context =
        this.validateContext();

      this.store.setState(
        {
          analytics: {
            loading:
              true,

            error:
              null
          }
        },
        {
          reason:
            "analytics-load-started"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.ANALYTICS_LOADING,
        {
          classId:
            context.classId
        }
      );

      try {
        const response =
          await this.api.get(
            this.configuration
              .endpoints
              .analytics,
            {
              query: {
                classId:
                  context.classId
              },

              requestKey:
                "media-library-analytics",

              cancelPrevious:
                true,

              signal:
                options.signal,

              timeoutMilliseconds:
                this.configuration
                  .requestTimeoutMilliseconds
            }
          );

        const analyticsData =
          response?.analytics ||
          response?.data ||
          response ||
          {};

        this.store.setState(
          {
            analytics: {
              data:
                analyticsData,

              loading:
                false,

              loaded:
                true,

              error:
                null
            }
          },
          {
            reason:
              "analytics-load-completed"
          }
        );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.ANALYTICS_LOADED,
          {
            analytics:
              analyticsData
          }
        );

        return analyticsData;
      } catch (
        analyticsError
      ) {
        const normalizedAnalyticsError =
          normalizeError(
            analyticsError,
            "Media analytics could not be loaded."
          );

        if (
          normalizedAnalyticsError
            .isAbortError
        ) {
          throw normalizedAnalyticsError;
        }

        this.store.setState(
          {
            analytics: {
              loading:
                false,

              loaded:
                false,

              error:
                normalizedAnalyticsError
            }
          },
          {
            reason:
              "analytics-load-failed"
          }
        );

        this.eventBus.emit(
          MEDIA_LIBRARY_EVENTS.ANALYTICS_FAILED,
          {
            error:
              normalizedAnalyticsError
          }
        );

        throw normalizedAnalyticsError;
      }
    }

    async loadInitialData() {
      if (
        this.loadPromise
      ) {
        return this.loadPromise;
      }

      this.loadPromise =
        Promise.allSettled([
          this.loadLibrary(),

          this.loadFolders(),

          this.loadAnalytics()
        ]);

      try {
        const results =
          await this.loadPromise;

        const rejectedResults =
          results.filter(
            result =>
              result.status ===
              "rejected"
          );

        if (
          rejectedResults.length ===
          results.length
        ) {
          throw normalizeError(
            rejectedResults[0]
              ?.reason,
            "The Media Library data could not be loaded."
          );
        }

        return results;
      } finally {
        this.loadPromise =
          null;
      }
    }

    async refresh() {
      this.dom.refresh();

      return this.loadInitialData();
    }

    setViewMode(
      requestedViewMode
    ) {
      const normalizedViewMode =
        safeString(
          requestedViewMode
        ).toLowerCase();

      if (
        !SUPPORTED_VIEW_MODES.has(
          normalizedViewMode
        )
      ) {
        throw new MediaLibraryError(
          `Unsupported media view mode: ${normalizedViewMode}`,
          {
            code:
              "INVALID_VIEW_MODE"
          }
        );
      }

      writeStorageValue(
        "viewMode",
        normalizedViewMode
      );

      this.store.setState(
        {
          view: {
            mode:
              normalizedViewMode
          }
        },
        {
          reason:
            "view-mode-changed"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.VIEW_CHANGED,
        {
          viewMode:
            normalizedViewMode
        }
      );

      return normalizedViewMode;
    }

    async setSearch(
      searchValue
    ) {
      const normalizedSearchValue =
        safeString(
          searchValue
        );

      this.store.setState(
        {
          filters: {
            search:
              normalizedSearchValue
          },

          library: {
            page:
              1
          }
        },
        {
          reason:
            "search-changed"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.SEARCH_CHANGED,
        {
          search:
            normalizedSearchValue
        }
      );

      return this.loadLibrary();
    }

    async setMediaType(
      requestedMediaType
    ) {
      const normalizedMediaType =
        safeString(
          requestedMediaType,
          "all"
        ).toLowerCase();

      if (
        !SUPPORTED_MEDIA_FILTERS.has(
          normalizedMediaType
        )
      ) {
        throw new MediaLibraryError(
          `Unsupported media type filter: ${normalizedMediaType}`,
          {
            code:
              "INVALID_MEDIA_FILTER"
          }
        );
      }

      this.store.setState(
        {
          filters: {
            type:
              normalizedMediaType
          },

          library: {
            page:
              1
          }
        },
        {
          reason:
            "media-filter-changed"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.FILTER_CHANGED,
        {
          mediaType:
            normalizedMediaType
        }
      );

      return this.loadLibrary();
    }

    async setSort(
      requestedSort
    ) {
      const normalizedSort =
        safeString(
          requestedSort,
          "newest"
        ).toLowerCase();

      if (
        !SUPPORTED_SORT_OPTIONS.has(
          normalizedSort
        )
      ) {
        throw new MediaLibraryError(
          `Unsupported media sort option: ${normalizedSort}`,
          {
            code:
              "INVALID_SORT_OPTION"
          }
        );
      }

      this.store.setState(
        {
          filters: {
            sort:
              normalizedSort
          },

          library: {
            page:
              1
          }
        },
        {
          reason:
            "sort-changed"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.SORT_CHANGED,
        {
          sort:
            normalizedSort
        }
      );

      return this.loadLibrary();
    }

    async setScope(
      requestedScope
    ) {
      const normalizedScope =
        safeString(
          requestedScope,
          "all"
        ).toLowerCase();

      if (
        !SUPPORTED_LIBRARY_SCOPES.has(
          normalizedScope
        )
      ) {
        throw new MediaLibraryError(
          `Unsupported media scope: ${normalizedScope}`,
          {
            code:
              "INVALID_LIBRARY_SCOPE"
          }
        );
      }

      this.store.setState(
        {
          filters: {
            scope:
              normalizedScope
          },

          context: {
            activeFolderId:
              normalizedScope ===
              "folder"
                ? this.store.get(
                    "context.activeFolderId",
                    ""
                  )
                : ""
          },

          library: {
            page:
              1
          },

          selection: {
            ids:
              [],

            anchorId:
              ""
          }
        },
        {
          reason:
            "library-scope-changed"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.SCOPE_CHANGED,
        {
          scope:
            normalizedScope
        }
      );

      return this.loadLibrary();
    }

    async setPage(
      requestedPage
    ) {
      const totalPages =
        Math.max(
          1,
          safeInteger(
            this.store.get(
              "library.totalPages",
              1
            ),
            1
          )
        );

      const resolvedPage =
        clampNumber(
          requestedPage,
          1,
          totalPages
        );

      this.store.setState(
        {
          library: {
            page:
              resolvedPage
          },

          selection: {
            ids:
              [],

            anchorId:
              ""
          }
        },
        {
          reason:
            "page-changed"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.PAGE_CHANGED,
        {
          page:
            resolvedPage
        }
      );

      return this.loadLibrary();
    }

    requestUpload() {
      this.dom.refresh();

      const fileInput =
        this.dom.get(
          "fileInput"
        );

      this.store.setState(
        {
          interface: {
            uploadPanelOpen:
              true
          }
        },
        {
          reason:
            "upload-requested"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.UPLOAD_REQUESTED,
        {
          classId:
            this.store.get(
              "context.classId"
            )
        }
      );

      if (
        fileInput &&
        isFunction(
          fileInput.click
        )
      ) {
        fileInput.click();

        return true;
      }

      this.notifications.warning(
        "The upload input is not connected yet. Confirm that the new Media Library HTML block contains the hidden file input.",
        {
          title:
            "Upload control missing"
        }
      );

      return false;
    }

    async destroy() {
      if (
        this.store.get(
          "lifecycle.destroyed"
        )
      ) {
        return;
      }

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.DESTROYING,
        {}
      );

      this.api.cancelAllRequests();

      while (
        this.cleanupCallbacks.length
      ) {
        const cleanupCallback =
          this.cleanupCallbacks.pop();

        try {
          await cleanupCallback();
        } catch (
          cleanupError
        ) {
          console.warn(
            "[AIFT Media Library] Cleanup callback failed:",
            cleanupError
          );
        }
      }

      this.store.setState(
        {
          lifecycle: {
            initialized:
              false,

            initializing:
              false,

            destroyed:
              true
          }
        },
        {
          reason:
            "application-destroyed"
        }
      );

      this.eventBus.emit(
        MEDIA_LIBRARY_EVENTS.DESTROYED,
        {}
      );

      this.store
        .clearSubscribers();

      this.eventBus.clear();
    }
  }

  /* =========================================================
     GLOBAL APPLICATION INSTANCE
  ========================================================= */

  const existingConfiguration =
    isObject(
      windowObject
        .AIFT_MEDIA_LIBRARY_CONFIG
    )
      ? windowObject
          .AIFT_MEDIA_LIBRARY_CONFIG
      : {};

  const application =
    new AiftMediaLibraryCore(
      existingConfiguration
    );

  const publicApplicationInterface = {
    __coreInitialized:
      true,

    name:
      APPLICATION_NAME,

    version:
      APPLICATION_VERSION,

    events:
      MEDIA_LIBRARY_EVENTS,

    configuration:
      application.configuration,

    application,

    api:
      application.api,

    authentication:
      application
        .authenticationManager,

    store:
      application.store,

    eventBus:
      application.eventBus,

    dom:
      application.dom,

    notifications:
      application.notifications,

    utilities: {
      isObject,

      isFunction,

      isString,

      isFiniteNumber,

      safeString,

      safeNumber,

      safeInteger,

      clampNumber,

      normalizeBoolean,

      normalizeArray,

      uniqueArray,

      createId,

      delay,

      debounce,

      throttle,

      deepClone,

      deepMerge,

      escapeHtml,

      escapeAttribute,

      sanitizeUrl,

      formatFileSize,

      formatCompactNumber,

      formatDate,

      formatRelativeDate,

      getFileExtension,

      detectMediaType,

      normalizeMediaItem,

      normalizeFolder,

      readStorageValue,

      writeStorageValue,

      removeStorageValue,

      normalizeError
    },

    classes: {
      MediaEventBus,

      MediaStateStore,

      MediaLibraryError,

      MediaAuthenticationManager,

      MediaApiClient,

      MediaDomRegistry,

      MediaNotificationManager,

      AiftMediaLibraryCore
    },

    initialize() {
      return application
        .initialize();
    },

    refresh() {
      return application
        .refresh();
    },

    destroy() {
      return application
        .destroy();
    },

    getState() {
      return application.store
        .getState();
    },

    subscribe(
      callback
    ) {
      return application.store
        .subscribe(
          callback
        );
    },

    on(
      eventName,
      callback
    ) {
      return application.eventBus
        .on(
          eventName,
          callback
        );
    },

    once(
      eventName,
      callback
    ) {
      return application.eventBus
        .once(
          eventName,
          callback
        );
    },

    off(
      eventName,
      callback
    ) {
      return application.eventBus
        .off(
          eventName,
          callback
        );
    },

    loadLibrary(
      options
    ) {
      return application
        .loadLibrary(
          options
        );
    },

    loadFolders(
      options
    ) {
      return application
        .loadFolders(
          options
        );
    },

    loadAnalytics(
      options
    ) {
      return application
        .loadAnalytics(
          options
        );
    },

    setViewMode(
      viewMode
    ) {
      return application
        .setViewMode(
          viewMode
        );
    },

    setSearch(
      searchValue
    ) {
      return application
        .setSearch(
          searchValue
        );
    },

    setMediaType(
      mediaType
    ) {
      return application
        .setMediaType(
          mediaType
        );
    },

    setSort(
      sortValue
    ) {
      return application
        .setSort(
          sortValue
        );
    },

    setScope(
      scopeValue
    ) {
      return application
        .setScope(
          scopeValue
        );
    },

    setPage(
      pageValue
    ) {
      return application
        .setPage(
          pageValue
        );
    },

    requestUpload() {
      return application
        .requestUpload();
    }
  };

  windowObject.AIFTMediaLibrary =
    publicApplicationInterface;

  /* =========================================================
     REPLACE THE OLD PLACEHOLDER UPLOAD FUNCTION
  ========================================================= */

  windowObject.openMediaUploader =
    function openMediaUploader() {
      return windowObject
        .AIFTMediaLibrary
        .requestUpload();
    };

  /* =========================================================
     AUTOMATIC INITIALIZATION
  ========================================================= */

  function startMediaLibrary() {
    if (
      !application
        .configuration
        .autoInitialize
    ) {
      return;
    }

    application
      .initialize()
      .catch(
        initializationError => {
          console.error(
            "[AIFT Media Library] Automatic initialization failed:",
            initializationError
          );
        }
      );
  }

  if (
    documentObject.readyState ===
    "loading"
  ) {
    documentObject.addEventListener(
      "DOMContentLoaded",
      startMediaLibrary,
      {
        once:
          true
      }
    );
  } else {
    startMediaLibrary();
  }
})(
  window,
  document
);

"use strict";

/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2A OF 15
   UPLOAD QUEUE FOUNDATION
========================================================= */

(function initializeAiftMediaUploadQueueFoundation(
  windowObject,
  documentObject
) {
  if (
    !windowObject ||
    !documentObject
  ) {
    return;
  }

  const mediaLibrary =
    windowObject.AIFTMediaLibrary;

  if (
    !mediaLibrary ||
    !mediaLibrary.__coreInitialized
  ) {
    console.error(
      "[AIFT Media Library] Part 2A requires Part 1 to be loaded first."
    );

    return;
  }

  if (
    mediaLibrary.__uploadQueueInitialized
  ) {
    console.warn(
      "[AIFT Media Library] Upload queue foundation has already been initialized."
    );

    return;
  }

  /* =========================================================
     CORE REFERENCES
  ========================================================= */

  const application =
    mediaLibrary.application;

  const api =
    mediaLibrary.api;

  const store =
    mediaLibrary.store;

  const eventBus =
    mediaLibrary.eventBus;

  const notifications =
    mediaLibrary.notifications;

  const utilities =
    mediaLibrary.utilities || {};

  const {
    isObject,
    isFunction,
    safeString,
    safeNumber,
    safeInteger,
    clampNumber,
    normalizeArray,
    createId,
    formatFileSize,
    getFileExtension,
    detectMediaType,
    normalizeError,
    deepClone
  } = utilities;

  /* =========================================================
     UPLOAD CONSTANTS
  ========================================================= */

  const UPLOAD_QUEUE_VERSION =
    "1.0.0";

  const UPLOAD_STORAGE_KEY =
    "aift.mediaLibrary.uploadQueue";

  const UPLOAD_FINGERPRINT_PREFIX =
    "aift-upload";

  const DEFAULT_MAXIMUM_QUEUE_ITEMS =
    250;

  const DEFAULT_MAXIMUM_FILE_SIZE_BYTES =
    5 * 1024 * 1024 * 1024;

  const DEFAULT_MINIMUM_FILE_SIZE_BYTES =
    1;

  const DEFAULT_FINGERPRINT_SAMPLE_SIZE_BYTES =
    256 * 1024;

  const DEFAULT_PERSIST_DEBOUNCE_MS =
    250;

  const DEFAULT_RECENT_COMPLETED_LIMIT =
    50;

  const DEFAULT_QUEUE_HISTORY_LIMIT =
    500;

  const DEFAULT_DUPLICATE_WINDOW_MS =
    3000;

  const UPLOAD_STATUS =
    Object.freeze({
      CREATED:
        "created",

      VALIDATING:
        "validating",

      QUEUED:
        "queued",

      WAITING:
        "waiting",

      HASHING:
        "hashing",

      CHECKING_DUPLICATE:
        "checking-duplicate",

      PREPARING:
        "preparing",

      UPLOADING:
        "uploading",

      PAUSED:
        "paused",

      RETRYING:
        "retrying",

      PROCESSING:
        "processing",

      COMPLETED:
        "completed",

      FAILED:
        "failed",

      CANCELED:
        "canceled",

      REJECTED:
        "rejected",

      REMOVED:
        "removed"
    });

  const TERMINAL_UPLOAD_STATUSES =
    new Set([
      UPLOAD_STATUS.COMPLETED,
      UPLOAD_STATUS.FAILED,
      UPLOAD_STATUS.CANCELED,
      UPLOAD_STATUS.REJECTED,
      UPLOAD_STATUS.REMOVED
    ]);

  const ACTIVE_UPLOAD_STATUSES =
    new Set([
      UPLOAD_STATUS.VALIDATING,
      UPLOAD_STATUS.HASHING,
      UPLOAD_STATUS.CHECKING_DUPLICATE,
      UPLOAD_STATUS.PREPARING,
      UPLOAD_STATUS.UPLOADING,
      UPLOAD_STATUS.RETRYING,
      UPLOAD_STATUS.PROCESSING
    ]);

  const PENDING_UPLOAD_STATUSES =
    new Set([
      UPLOAD_STATUS.CREATED,
      UPLOAD_STATUS.QUEUED,
      UPLOAD_STATUS.WAITING,
      UPLOAD_STATUS.PAUSED
    ]);

  const RETRYABLE_UPLOAD_STATUSES =
    new Set([
      UPLOAD_STATUS.FAILED,
      UPLOAD_STATUS.CANCELED
    ]);

  const RESTORABLE_UPLOAD_STATUSES =
    new Set([
      UPLOAD_STATUS.CREATED,
      UPLOAD_STATUS.QUEUED,
      UPLOAD_STATUS.WAITING,
      UPLOAD_STATUS.PAUSED,
      UPLOAD_STATUS.FAILED,
      UPLOAD_STATUS.CANCELED
    ]);

  const ALLOWED_UPLOAD_STATUS_TRANSITIONS =
    Object.freeze({
      [UPLOAD_STATUS.CREATED]:
        new Set([
          UPLOAD_STATUS.VALIDATING,
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.REJECTED,
          UPLOAD_STATUS.CANCELED,
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.VALIDATING]:
        new Set([
          UPLOAD_STATUS.HASHING,
          UPLOAD_STATUS.CHECKING_DUPLICATE,
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.REJECTED,
          UPLOAD_STATUS.FAILED,
          UPLOAD_STATUS.CANCELED
        ]),

      [UPLOAD_STATUS.QUEUED]:
        new Set([
          UPLOAD_STATUS.WAITING,
          UPLOAD_STATUS.HASHING,
          UPLOAD_STATUS.CHECKING_DUPLICATE,
          UPLOAD_STATUS.PREPARING,
          UPLOAD_STATUS.UPLOADING,
          UPLOAD_STATUS.PAUSED,
          UPLOAD_STATUS.CANCELED,
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.WAITING]:
        new Set([
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.PREPARING,
          UPLOAD_STATUS.UPLOADING,
          UPLOAD_STATUS.PAUSED,
          UPLOAD_STATUS.CANCELED,
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.HASHING]:
        new Set([
          UPLOAD_STATUS.CHECKING_DUPLICATE,
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.FAILED,
          UPLOAD_STATUS.CANCELED
        ]),

      [UPLOAD_STATUS.CHECKING_DUPLICATE]:
        new Set([
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.REJECTED,
          UPLOAD_STATUS.FAILED,
          UPLOAD_STATUS.CANCELED
        ]),

      [UPLOAD_STATUS.PREPARING]:
        new Set([
          UPLOAD_STATUS.UPLOADING,
          UPLOAD_STATUS.PAUSED,
          UPLOAD_STATUS.FAILED,
          UPLOAD_STATUS.CANCELED
        ]),

      [UPLOAD_STATUS.UPLOADING]:
        new Set([
          UPLOAD_STATUS.PAUSED,
          UPLOAD_STATUS.RETRYING,
          UPLOAD_STATUS.PROCESSING,
          UPLOAD_STATUS.COMPLETED,
          UPLOAD_STATUS.FAILED,
          UPLOAD_STATUS.CANCELED
        ]),

      [UPLOAD_STATUS.PAUSED]:
        new Set([
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.WAITING,
          UPLOAD_STATUS.PREPARING,
          UPLOAD_STATUS.UPLOADING,
          UPLOAD_STATUS.CANCELED,
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.RETRYING]:
        new Set([
          UPLOAD_STATUS.PREPARING,
          UPLOAD_STATUS.UPLOADING,
          UPLOAD_STATUS.FAILED,
          UPLOAD_STATUS.CANCELED
        ]),

      [UPLOAD_STATUS.PROCESSING]:
        new Set([
          UPLOAD_STATUS.COMPLETED,
          UPLOAD_STATUS.FAILED,
          UPLOAD_STATUS.CANCELED
        ]),

      [UPLOAD_STATUS.COMPLETED]:
        new Set([
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.FAILED]:
        new Set([
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.RETRYING,
          UPLOAD_STATUS.CANCELED,
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.CANCELED]:
        new Set([
          UPLOAD_STATUS.QUEUED,
          UPLOAD_STATUS.RETRYING,
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.REJECTED]:
        new Set([
          UPLOAD_STATUS.REMOVED
        ]),

      [UPLOAD_STATUS.REMOVED]:
        new Set()
    });

  const UPLOAD_PRIORITY =
    Object.freeze({
      LOW:
        "low",

      NORMAL:
        "normal",

      HIGH:
        "high",

      URGENT:
        "urgent"
    });

  const UPLOAD_PRIORITY_WEIGHT =
    Object.freeze({
      [UPLOAD_PRIORITY.LOW]:
        10,

      [UPLOAD_PRIORITY.NORMAL]:
        20,

      [UPLOAD_PRIORITY.HIGH]:
        30,

      [UPLOAD_PRIORITY.URGENT]:
        40
    });

  const UPLOAD_SOURCE =
    Object.freeze({
      FILE_PICKER:
        "file-picker",

      DRAG_AND_DROP:
        "drag-and-drop",

      PASTE:
        "paste",

      CAMERA:
        "camera",

      RECORDING:
        "recording",

      IMPORT:
        "import",

      PROGRAMMATIC:
        "programmatic",

      RESTORED:
        "restored",

      UNKNOWN:
        "unknown"
    });

  const UPLOAD_ERROR_CODE =
    Object.freeze({
      INVALID_FILE:
        "UPLOAD_INVALID_FILE",

      EMPTY_FILE:
        "UPLOAD_EMPTY_FILE",

      FILE_TOO_LARGE:
        "UPLOAD_FILE_TOO_LARGE",

      UNSUPPORTED_TYPE:
        "UPLOAD_UNSUPPORTED_TYPE",

      DUPLICATE:
        "UPLOAD_DUPLICATE",

      QUEUE_FULL:
        "UPLOAD_QUEUE_FULL",

      FILE_UNAVAILABLE:
        "UPLOAD_FILE_UNAVAILABLE",

      INVALID_TRANSITION:
        "UPLOAD_INVALID_STATUS_TRANSITION",

      HASH_FAILED:
        "UPLOAD_HASH_FAILED",

      STORAGE_FAILED:
        "UPLOAD_STORAGE_FAILED",

      CANCELED:
        "UPLOAD_CANCELED",

      UNKNOWN:
        "UPLOAD_UNKNOWN_ERROR"
    });

  const UPLOAD_EVENTS =
    Object.freeze({
      FOUNDATION_INITIALIZED:
        "media-library:upload-foundation-initialized",

      QUEUE_CHANGED:
        "media-library:upload-queue-changed",

      QUEUE_RESTORED:
        "media-library:upload-queue-restored",

      QUEUE_CLEARED:
        "media-library:upload-queue-cleared",

      ITEM_CREATED:
        "media-library:upload-item-created",

      ITEM_ADDED:
        "media-library:upload-item-added",

      ITEM_UPDATED:
        "media-library:upload-item-updated",

      ITEM_REMOVED:
        "media-library:upload-item-removed",

      ITEM_STATUS_CHANGED:
        "media-library:upload-item-status-changed",

      ITEM_PROGRESS:
        "media-library:upload-item-progress",

      ITEM_REJECTED:
        "media-library:upload-item-rejected",

      ITEM_FAILED:
        "media-library:upload-item-failed",

      ITEM_COMPLETED:
        "media-library:upload-item-completed",

      ITEM_CANCELED:
        "media-library:upload-item-canceled",

      ITEM_PAUSED:
        "media-library:upload-item-paused",

      ITEM_RESUMED:
        "media-library:upload-item-resumed",

      ITEM_RETRY_REQUESTED:
        "media-library:upload-item-retry-requested",

      FINGERPRINT_STARTED:
        "media-library:upload-fingerprint-started",

      FINGERPRINT_COMPLETED:
        "media-library:upload-fingerprint-completed",

      FINGERPRINT_FAILED:
        "media-library:upload-fingerprint-failed",

      DUPLICATE_DETECTED:
        "media-library:upload-duplicate-detected",

      PERSISTENCE_FAILED:
        "media-library:upload-persistence-failed"
    });

  /* =========================================================
     UTILITY FALLBACKS
  ========================================================= */

  function localIsObject(
    value
  ) {
    return (
      value !== null &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  }

  function localIsFunction(
    value
  ) {
    return typeof value ===
      "function";
  }

  function localSafeString(
    value,
    fallback = ""
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    const normalizedValue =
      String(value).trim();

    return normalizedValue ||
      fallback;
  }

  function localSafeNumber(
    value,
    fallback = 0
  ) {
    const numericValue =
      Number(value);

    return Number.isFinite(
      numericValue
    )
      ? numericValue
      : fallback;
  }

  function localSafeInteger(
    value,
    fallback = 0
  ) {
    const numericValue =
      localSafeNumber(
        value,
        fallback
      );

    return Number.isFinite(
      numericValue
    )
      ? Math.trunc(
          numericValue
        )
      : fallback;
  }

  function localClampNumber(
    value,
    minimum,
    maximum
  ) {
    return Math.min(
      maximum,
      Math.max(
        minimum,
        localSafeNumber(
          value,
          minimum
        )
      )
    );
  }

  function localNormalizeArray(
    value
  ) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    return [value];
  }

  function localCreateId(
    prefix = "id"
  ) {
    const timestamp =
      Date.now()
        .toString(36);

    const randomPart =
      Math.random()
        .toString(36)
        .slice(
          2,
          12
        );

    return `${prefix}-${timestamp}-${randomPart}`;
  }

  function localGetFileExtension(
    fileName
  ) {
    const normalizedFileName =
      localSafeString(
        fileName
      );

    const finalDotIndex =
      normalizedFileName
        .lastIndexOf(".");

    if (
      finalDotIndex <= 0 ||
      finalDotIndex ===
        normalizedFileName.length - 1
    ) {
      return "";
    }

    return normalizedFileName
      .slice(
        finalDotIndex + 1
      )
      .toLowerCase();
  }

  function localDetectMediaType(
    fileOrName,
    mimeType = ""
  ) {
    const resolvedMimeType =
      localSafeString(
        fileOrName?.type ||
        mimeType
      ).toLowerCase();

    const resolvedName =
      localSafeString(
        fileOrName?.name ||
        fileOrName
      );

    const extension =
      localGetFileExtension(
        resolvedName
      );

    if (
      resolvedMimeType.startsWith(
        "image/"
      )
    ) {
      return "image";
    }

    if (
      resolvedMimeType.startsWith(
        "video/"
      )
    ) {
      return "video";
    }

    if (
      resolvedMimeType.startsWith(
        "audio/"
      )
    ) {
      return "audio";
    }

    if (
      resolvedMimeType ===
        "application/pdf" ||
      extension ===
        "pdf"
    ) {
      return "pdf";
    }

    if (
      [
        "ppt",
        "pptx",
        "odp",
        "key"
      ].includes(
        extension
      )
    ) {
      return "presentation";
    }

    if (
      [
        "xls",
        "xlsx",
        "ods",
        "csv"
      ].includes(
        extension
      )
    ) {
      return "spreadsheet";
    }

    if (
      [
        "zip",
        "rar",
        "7z",
        "tar",
        "gz"
      ].includes(
        extension
      )
    ) {
      return "archive";
    }

    if (
      resolvedMimeType.startsWith(
        "text/"
      ) ||
      [
        "doc",
        "docx",
        "odt",
        "rtf",
        "txt",
        "md"
      ].includes(
        extension
      )
    ) {
      return "document";
    }

    return "other";
  }

  function localNormalizeError(
    error,
    fallbackMessage =
      "An unexpected upload error occurred."
  ) {
    if (
      error instanceof Error
    ) {
      return {
        name:
          error.name ||
          "Error",

        message:
          error.message ||
          fallbackMessage,

        code:
          error.code ||
          UPLOAD_ERROR_CODE.UNKNOWN,

        stack:
          error.stack ||
          "",

        details:
          error.details ||
          null
      };
    }

    if (
      localIsObject(error)
    ) {
      return {
        name:
          localSafeString(
            error.name,
            "Error"
          ),

        message:
          localSafeString(
            error.message,
            fallbackMessage
          ),

        code:
          localSafeString(
            error.code,
            UPLOAD_ERROR_CODE.UNKNOWN
          ),

        stack:
          localSafeString(
            error.stack
          ),

        details:
          error.details ||
          null
      };
    }

    return {
      name:
        "Error",

      message:
        localSafeString(
          error,
          fallbackMessage
        ),

      code:
        UPLOAD_ERROR_CODE.UNKNOWN,

      stack:
        "",

      details:
        null
    };
  }

  function localDeepClone(
    value
  ) {
    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (
        cloneError
      ) {
        void cloneError;
      }
    }

    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  }

  const resolvedIsObject =
    isFunction?.bind
      ? isObject
      : localIsObject;

  const resolvedIsFunction =
    isFunction ||
    localIsFunction;

  const resolvedSafeString =
    safeString ||
    localSafeString;

  const resolvedSafeNumber =
    safeNumber ||
    localSafeNumber;

  const resolvedSafeInteger =
    safeInteger ||
    localSafeInteger;

  const resolvedClampNumber =
    clampNumber ||
    localClampNumber;

  const resolvedNormalizeArray =
    normalizeArray ||
    localNormalizeArray;

  const resolvedCreateId =
    createId ||
    localCreateId;

  const resolvedGetFileExtension =
    getFileExtension ||
    localGetFileExtension;

  const resolvedDetectMediaType =
    detectMediaType ||
    localDetectMediaType;

  const resolvedNormalizeError =
    normalizeError ||
    localNormalizeError;

  const resolvedDeepClone =
    deepClone ||
    localDeepClone;

  /* =========================================================
     GENERAL HELPERS
  ========================================================= */

  function nowIsoString() {
    return new Date()
      .toISOString();
  }

  function normalizeTimestamp(
    value,
    fallback =
      nowIsoString()
  ) {
    const normalizedValue =
      resolvedSafeString(
        value
      );

    if (
      !normalizedValue
    ) {
      return fallback;
    }

    const parsedTimestamp =
      Date.parse(
        normalizedValue
      );

    if (
      Number.isNaN(
        parsedTimestamp
      )
    ) {
      return fallback;
    }

    return new Date(
      parsedTimestamp
    ).toISOString();
  }

  function normalizeUploadPriority(
    value
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        UPLOAD_PRIORITY.NORMAL
      ).toLowerCase();

    if (
      Object.values(
        UPLOAD_PRIORITY
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return UPLOAD_PRIORITY.NORMAL;
  }

  function normalizeUploadSource(
    value
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        UPLOAD_SOURCE.UNKNOWN
      ).toLowerCase();

    if (
      Object.values(
        UPLOAD_SOURCE
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return UPLOAD_SOURCE.UNKNOWN;
  }

  function normalizeUploadStatus(
    value,
    fallback =
      UPLOAD_STATUS.CREATED
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        fallback
      ).toLowerCase();

    if (
      Object.values(
        UPLOAD_STATUS
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return fallback;
  }

  function normalizeProgress(
    value
  ) {
    return resolvedClampNumber(
      resolvedSafeNumber(
        value,
        0
      ),
      0,
      100
    );
  }

  function normalizeByteCount(
    value
  ) {
    return Math.max(
      0,
      resolvedSafeInteger(
        value,
        0
      )
    );
  }

  function isFileObject(
    value
  ) {
    if (
      typeof File ===
        "undefined"
    ) {
      return false;
    }

    return value instanceof File;
  }

  function isBlobObject(
    value
  ) {
    if (
      typeof Blob ===
        "undefined"
    ) {
      return false;
    }

    return value instanceof Blob;
  }

  function resolveFileName(
    file,
    fallback =
      "untitled"
  ) {
    const fileName =
      resolvedSafeString(
        file?.name
      );

    if (
      fileName
    ) {
      return fileName;
    }

    const generatedExtension =
      resolvedGetFileExtension(
        fallback
      );

    if (
      generatedExtension
    ) {
      return fallback;
    }

    return resolvedSafeString(
      fallback,
      "untitled"
    );
  }

  function resolveRelativePath(
    file
  ) {
    return resolvedSafeString(
      file?.webkitRelativePath ||
      file?.relativePath
    );
  }

  function resolveLastModified(
    file
  ) {
    const timestamp =
      resolvedSafeNumber(
        file?.lastModified,
        Date.now()
      );

    return Math.max(
      0,
      Math.trunc(
        timestamp
      )
    );
  }

  function resolveClassId() {
    return resolvedSafeString(
      store?.get?.(
        "context.classId"
      ) ||
      application?.store?.get?.(
        "context.classId"
      )
    );
  }

  function createUploadError(
    message,
    options = {}
  ) {
    const normalizedMessage =
      resolvedSafeString(
        message,
        "An upload error occurred."
      );

    const uploadError =
      new Error(
        normalizedMessage
      );

    uploadError.name =
      "MediaUploadError";

    uploadError.code =
      resolvedSafeString(
        options.code,
        UPLOAD_ERROR_CODE.UNKNOWN
      );

    uploadError.details =
      options.details ||
      null;

    uploadError.retryable =
      Boolean(
        options.retryable
      );

    uploadError.cause =
      options.cause ||
      null;

    return uploadError;
  }

  function canTransitionUploadStatus(
    currentStatus,
    nextStatus
  ) {
    const normalizedCurrentStatus =
      normalizeUploadStatus(
        currentStatus
      );

    const normalizedNextStatus =
      normalizeUploadStatus(
        nextStatus
      );

    if (
      normalizedCurrentStatus ===
      normalizedNextStatus
    ) {
      return true;
    }

    const allowedTransitions =
      ALLOWED_UPLOAD_STATUS_TRANSITIONS[
        normalizedCurrentStatus
      ];

    return Boolean(
      allowedTransitions &&
      allowedTransitions.has(
        normalizedNextStatus
      )
    );
  }

  function calculateUploadSpeed(
    uploadedBytes,
    startedAt,
    currentTimestamp =
      Date.now()
  ) {
    const normalizedUploadedBytes =
      normalizeByteCount(
        uploadedBytes
      );

    const startTimestamp =
      typeof startedAt ===
        "number"
        ? startedAt
        : Date.parse(
            resolvedSafeString(
              startedAt
            )
          );

    if (
      !Number.isFinite(
        startTimestamp
      ) ||
      startTimestamp <= 0
    ) {
      return 0;
    }

    const elapsedMilliseconds =
      Math.max(
        1,
        currentTimestamp -
        startTimestamp
      );

    return Math.round(
      normalizedUploadedBytes /
      (
        elapsedMilliseconds /
        1000
      )
    );
  }

  function calculateEstimatedSecondsRemaining(
    totalBytes,
    uploadedBytes,
    bytesPerSecond
  ) {
    const normalizedTotalBytes =
      normalizeByteCount(
        totalBytes
      );

    const normalizedUploadedBytes =
      normalizeByteCount(
        uploadedBytes
      );

    const normalizedSpeed =
      Math.max(
        0,
        resolvedSafeNumber(
          bytesPerSecond,
          0
        )
      );

    if (
      normalizedSpeed <= 0
    ) {
      return null;
    }

    const remainingBytes =
      Math.max(
        0,
        normalizedTotalBytes -
        normalizedUploadedBytes
      );

    return Math.ceil(
      remainingBytes /
      normalizedSpeed
    );
  }

  function createBasicFingerprint(
    file
  ) {
    const fileName =
      resolveFileName(
        file
      );

    const fileSize =
      normalizeByteCount(
        file?.size
      );

    const lastModified =
      resolveLastModified(
        file
      );

    const mimeType =
      resolvedSafeString(
        file?.type,
        "application/octet-stream"
      ).toLowerCase();

    return [
      UPLOAD_FINGERPRINT_PREFIX,
      fileName.toLowerCase(),
      fileSize,
      lastModified,
      mimeType
    ].join(":");
  }

  function createQueueSnapshotItem(
    item
  ) {
    if (
      item &&
      resolvedIsFunction(
        item.toJSON
      )
    ) {
      return item.toJSON();
    }

    return resolvedDeepClone(
      item
    );
  }

  /* =========================================================
     SHA-256 HELPERS
  ========================================================= */

  function arrayBufferToHex(
    arrayBuffer
  ) {
    const bytes =
      new Uint8Array(
        arrayBuffer
      );

    let result =
      "";

    for (
      const byte
      of bytes
    ) {
      result += byte
        .toString(16)
        .padStart(
          2,
          "0"
        );
    }

    return result;
  }

  async function digestArrayBuffer(
    arrayBuffer
  ) {
    if (
      !windowObject.crypto ||
      !windowObject.crypto.subtle
    ) {
      throw createUploadError(
        "Secure file hashing is not supported by this browser.",
        {
          code:
            UPLOAD_ERROR_CODE.HASH_FAILED
        }
      );
    }

    const digest =
      await windowObject.crypto
        .subtle
        .digest(
          "SHA-256",
          arrayBuffer
        );

    return arrayBufferToHex(
      digest
    );
  }

  async function readBlobAsArrayBuffer(
    blob
  ) {
    if (
      blob &&
      resolvedIsFunction(
        blob.arrayBuffer
      )
    ) {
      return blob.arrayBuffer();
    }

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () => {
            resolve(
              reader.result
            );
          };

        reader.onerror =
          () => {
            reject(
              reader.error ||
              createUploadError(
                "The selected file could not be read.",
                {
                  code:
                    UPLOAD_ERROR_CODE.FILE_UNAVAILABLE
                }
              )
            );
          };

        reader.onabort =
          () => {
            reject(
              createUploadError(
                "File reading was canceled.",
                {
                  code:
                    UPLOAD_ERROR_CODE.CANCELED
                }
              )
            );
          };

        reader.readAsArrayBuffer(
          blob
        );
      }
    );
  }

  /* =========================================================
     UPLOAD FINGERPRINT SERVICE
  ========================================================= */

  class UploadFingerprintService {
    constructor(
      options = {}
    ) {
      this.sampleSizeBytes =
        Math.max(
          16 * 1024,
          resolvedSafeInteger(
            options.sampleSizeBytes,
            DEFAULT_FINGERPRINT_SAMPLE_SIZE_BYTES
          )
        );

      this.hashCache =
        new WeakMap();

      this.activeHashes =
        new WeakMap();
    }

    async create(
      file,
      options = {}
    ) {
      if (
        !isBlobObject(
          file
        )
      ) {
        throw createUploadError(
          "A valid browser File or Blob is required to create an upload fingerprint.",
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_FILE
          }
        );
      }

      if (
        this.hashCache.has(
          file
        )
      ) {
        return this.hashCache.get(
          file
        );
      }

      if (
        this.activeHashes.has(
          file
        )
      ) {
        return this.activeHashes.get(
          file
        );
      }

      const hashPromise =
        this.performCreate(
          file,
          options
        );

      this.activeHashes.set(
        file,
        hashPromise
      );

      try {
        const result =
          await hashPromise;

        this.hashCache.set(
          file,
          result
        );

        return result;
      } finally {
        this.activeHashes.delete(
          file
        );
      }
    }

    async performCreate(
      file,
      options = {}
    ) {
      const fileSize =
        normalizeByteCount(
          file.size
        );

      const sampleSize =
        Math.min(
          this.sampleSizeBytes,
          fileSize
        );

      const includeMiddleSample =
        options.includeMiddleSample !==
        false;

      const segments =
        [];

      if (
        fileSize <=
        this.sampleSizeBytes * 3
      ) {
        segments.push(
          file.slice(
            0,
            fileSize
          )
        );
      } else {
        segments.push(
          file.slice(
            0,
            sampleSize
          )
        );

        if (
          includeMiddleSample
        ) {
          const middleStart =
            Math.max(
              0,
              Math.floor(
                (
                  fileSize -
                  sampleSize
                ) /
                2
              )
            );

          segments.push(
            file.slice(
              middleStart,
              middleStart +
                sampleSize
            )
          );
        }

        segments.push(
          file.slice(
            Math.max(
              0,
              fileSize -
              sampleSize
            ),
            fileSize
          )
        );
      }

      const metadataText =
        [
          resolveFileName(
            file
          ),
          fileSize,
          resolveLastModified(
            file
          ),
          resolvedSafeString(
            file.type
          ),
          resolveRelativePath(
            file
          )
        ].join("|");

      const metadataBytes =
        new TextEncoder()
          .encode(
            metadataText
          );

      const segmentBuffers =
        await Promise.all(
          segments.map(
            segment =>
              readBlobAsArrayBuffer(
                segment
              )
          )
        );

      const totalLength =
        metadataBytes.byteLength +
        segmentBuffers.reduce(
          (
            total,
            buffer
          ) =>
            total +
            buffer.byteLength,
          0
        );

      const combinedBytes =
        new Uint8Array(
          totalLength
        );

      let offset =
        0;

      combinedBytes.set(
        metadataBytes,
        offset
      );

      offset +=
        metadataBytes.byteLength;

      for (
        const segmentBuffer
        of segmentBuffers
      ) {
        const segmentBytes =
          new Uint8Array(
            segmentBuffer
          );

        combinedBytes.set(
          segmentBytes,
          offset
        );

        offset +=
          segmentBytes.byteLength;
      }

      const hash =
        await digestArrayBuffer(
          combinedBytes.buffer
        );

      return {
        algorithm:
          "SHA-256",

        hash,

        fingerprint:
          `${UPLOAD_FINGERPRINT_PREFIX}:sha256:${hash}`,

        basicFingerprint:
          createBasicFingerprint(
            file
          ),

        sampledBytes:
          segmentBuffers.reduce(
            (
              total,
              buffer
            ) =>
              total +
              buffer.byteLength,
            0
          ),

        totalFileBytes:
          fileSize,

        createdAt:
          nowIsoString()
      };
    }

    clear(
      file
    ) {
      if (
        file &&
        this.hashCache.has(
          file
        )
      ) {
        this.hashCache.delete(
          file
        );
      }

      if (
        file &&
        this.activeHashes.has(
          file
        )
      ) {
        this.activeHashes.delete(
          file
        );
      }
    }
  }

  /* =========================================================
     UPLOAD QUEUE ITEM
  ========================================================= */

  class UploadQueueItem {
    constructor(
      file,
      options = {}
    ) {
      const restoredData =
        resolvedIsObject(
          options.restoredData
        )
          ? options.restoredData
          : null;

      if (
        !file &&
        !restoredData
      ) {
        throw createUploadError(
          "An upload queue item requires a File, Blob, or restorable upload record.",
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_FILE
          }
        );
      }

      if (
        file &&
        !isBlobObject(
          file
        )
      ) {
        throw createUploadError(
          "The selected upload is not a valid browser File or Blob.",
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_FILE
          }
        );
      }

      const sourceData =
        restoredData ||
        {};

      this.id =
        resolvedSafeString(
          sourceData.id ||
          options.id,
          resolvedCreateId(
            "media-upload"
          )
        );

      this.file =
        file ||
        null;

      this.fileAvailable =
        Boolean(
          file
        );

      this.name =
        resolvedSafeString(
          sourceData.name ||
          options.name ||
          resolveFileName(
            file
          ),
          "untitled"
        );

      this.originalName =
        resolvedSafeString(
          sourceData.originalName ||
          options.originalName ||
          this.name,
          this.name
        );

      this.relativePath =
        resolvedSafeString(
          sourceData.relativePath ||
          options.relativePath ||
          resolveRelativePath(
            file
          )
        );

      this.extension =
        resolvedSafeString(
          sourceData.extension ||
          options.extension ||
          resolvedGetFileExtension(
            this.name
          )
        ).toLowerCase();

      this.mimeType =
        resolvedSafeString(
          sourceData.mimeType ||
          options.mimeType ||
          file?.type,
          "application/octet-stream"
        ).toLowerCase();

      this.mediaType =
        resolvedSafeString(
          sourceData.mediaType ||
          options.mediaType ||
          resolvedDetectMediaType(
            file ||
            this.name,
            this.mimeType
          ),
          "other"
        ).toLowerCase();

      this.size =
        normalizeByteCount(
          sourceData.size ??
          options.size ??
          file?.size
        );

      this.lastModified =
        Math.max(
          0,
          resolvedSafeInteger(
            sourceData.lastModified ??
            options.lastModified ??
            file?.lastModified,
            Date.now()
          )
        );

      this.classId =
        resolvedSafeString(
          sourceData.classId ||
          options.classId ||
          resolveClassId()
        );

      this.folderId =
        resolvedSafeString(
          sourceData.folderId ||
          options.folderId
        );

      this.source =
        normalizeUploadSource(
          sourceData.source ||
          options.source
        );

      this.priority =
        normalizeUploadPriority(
          sourceData.priority ||
          options.priority
        );

      this.status =
        normalizeUploadStatus(
          sourceData.status ||
          options.status,
          restoredData
            ? UPLOAD_STATUS.PAUSED
            : UPLOAD_STATUS.CREATED
        );

      if (
        restoredData &&
        !RESTORABLE_UPLOAD_STATUSES.has(
          this.status
        )
      ) {
        this.status =
          UPLOAD_STATUS.PAUSED;
      }

      this.progress =
        normalizeProgress(
          sourceData.progress ??
          options.progress
        );

      this.uploadedBytes =
        normalizeByteCount(
          sourceData.uploadedBytes ??
          options.uploadedBytes
        );

      this.totalBytes =
        normalizeByteCount(
          sourceData.totalBytes ??
          options.totalBytes ??
          this.size
        );

      if (
        this.uploadedBytes >
        this.totalBytes
      ) {
        this.uploadedBytes =
          this.totalBytes;
      }

      this.bytesPerSecond =
        Math.max(
          0,
          resolvedSafeNumber(
            sourceData.bytesPerSecond ??
            options.bytesPerSecond,
            0
          )
        );

      this.estimatedSecondsRemaining =
        sourceData
          .estimatedSecondsRemaining ??
        options
          .estimatedSecondsRemaining ??
        null;

      this.attempt =
        Math.max(
          0,
          resolvedSafeInteger(
            sourceData.attempt ??
            options.attempt,
            0
          )
        );

      this.maximumAttempts =
        Math.max(
          1,
          resolvedSafeInteger(
            sourceData.maximumAttempts ??
            options.maximumAttempts,
            3
          )
        );

      this.fingerprint =
        resolvedSafeString(
          sourceData.fingerprint ||
          options.fingerprint
        );

      this.basicFingerprint =
        resolvedSafeString(
          sourceData.basicFingerprint ||
          options.basicFingerprint ||
          (
            file
              ? createBasicFingerprint(
                  file
                )
              : ""
          )
        );

      this.hashAlgorithm =
        resolvedSafeString(
          sourceData.hashAlgorithm ||
          options.hashAlgorithm
        );

      this.hash =
        resolvedSafeString(
          sourceData.hash ||
          options.hash
        );

      this.remoteUploadId =
        resolvedSafeString(
          sourceData.remoteUploadId ||
          options.remoteUploadId
        );

      this.remoteMediaId =
        resolvedSafeString(
          sourceData.remoteMediaId ||
          options.remoteMediaId
        );

      this.remoteUrl =
        resolvedSafeString(
          sourceData.remoteUrl ||
          options.remoteUrl
        );

      this.thumbnailUrl =
        resolvedSafeString(
          sourceData.thumbnailUrl ||
          options.thumbnailUrl
        );

      this.metadata =
        resolvedIsObject(
          sourceData.metadata ||
          options.metadata
        )
          ? resolvedDeepClone(
              sourceData.metadata ||
              options.metadata
            )
          : {};

      this.tags =
        Array.from(
          new Set(
            resolvedNormalizeArray(
              sourceData.tags ||
              options.tags
            )
              .map(
                tag =>
                  resolvedSafeString(
                    tag
                  )
              )
              .filter(
                Boolean
              )
          )
        );

      this.error =
        sourceData.error
          ? resolvedNormalizeError(
              sourceData.error
            )
          : null;

      this.warning =
        sourceData.warning
          ? resolvedNormalizeError(
              sourceData.warning,
              "An upload warning occurred."
            )
          : null;

      this.duplicate =
        resolvedIsObject(
          sourceData.duplicate ||
          options.duplicate
        )
          ? resolvedDeepClone(
              sourceData.duplicate ||
              options.duplicate
            )
          : null;

      this.createdAt =
        normalizeTimestamp(
          sourceData.createdAt ||
          options.createdAt
        );

      this.updatedAt =
        normalizeTimestamp(
          sourceData.updatedAt ||
          options.updatedAt,
          this.createdAt
        );

      this.queuedAt =
        sourceData.queuedAt
          ? normalizeTimestamp(
              sourceData.queuedAt
            )
          : null;

      this.startedAt =
        sourceData.startedAt
          ? normalizeTimestamp(
              sourceData.startedAt
            )
          : null;

      this.pausedAt =
        sourceData.pausedAt
          ? normalizeTimestamp(
              sourceData.pausedAt
            )
          : null;

      this.completedAt =
        sourceData.completedAt
          ? normalizeTimestamp(
              sourceData.completedAt
            )
          : null;

      this.failedAt =
        sourceData.failedAt
          ? normalizeTimestamp(
              sourceData.failedAt
            )
          : null;

      this.canceledAt =
        sourceData.canceledAt
          ? normalizeTimestamp(
              sourceData.canceledAt
            )
          : null;

      this.removedAt =
        sourceData.removedAt
          ? normalizeTimestamp(
              sourceData.removedAt
            )
          : null;

      this.lastProgressAt =
        sourceData.lastProgressAt
          ? normalizeTimestamp(
              sourceData.lastProgressAt
            )
          : null;

      this.history =
        resolvedNormalizeArray(
          sourceData.history
        )
          .filter(
            resolvedIsObject
          )
          .slice(
            -DEFAULT_QUEUE_HISTORY_LIMIT
          )
          .map(
            historyEntry => ({
              status:
                normalizeUploadStatus(
                  historyEntry.status,
                  this.status
                ),

              previousStatus:
                historyEntry.previousStatus
                  ? normalizeUploadStatus(
                      historyEntry.previousStatus
                    )
                  : null,

              timestamp:
                normalizeTimestamp(
                  historyEntry.timestamp
                ),

              reason:
                resolvedSafeString(
                  historyEntry.reason
                ),

              metadata:
                resolvedIsObject(
                  historyEntry.metadata
                )
                  ? resolvedDeepClone(
                      historyEntry.metadata
                    )
                  : {}
            })
          );

      if (
        !this.history.length
      ) {
        this.recordHistory(
          this.status,
          null,
          "item-created"
        );
      }

      this.recalculateProgress();
    }

    isTerminal() {
      return TERMINAL_UPLOAD_STATUSES.has(
        this.status
      );
    }

    isActive() {
      return ACTIVE_UPLOAD_STATUSES.has(
        this.status
      );
    }

    isPending() {
      return PENDING_UPLOAD_STATUSES.has(
        this.status
      );
    }

    isRetryable() {
      return (
        RETRYABLE_UPLOAD_STATUSES.has(
          this.status
        ) &&
        this.attempt <
          this.maximumAttempts
      );
    }

    hasFile() {
      return Boolean(
        this.file &&
        isBlobObject(
          this.file
        )
      );
    }

    setFile(
      file
    ) {
      if (
        !isBlobObject(
          file
        )
      ) {
        throw createUploadError(
          "The replacement upload is not a valid File or Blob.",
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_FILE
          }
        );
      }

      this.file =
        file;

      this.fileAvailable =
        true;

      this.name =
        resolveFileName(
          file,
          this.name
        );

      this.originalName =
        this.originalName ||
        this.name;

      this.relativePath =
        resolveRelativePath(
          file
        ) ||
        this.relativePath;

      this.extension =
        resolvedGetFileExtension(
          this.name
        );

      this.mimeType =
        resolvedSafeString(
          file.type,
          this.mimeType
        ).toLowerCase();

      this.mediaType =
        resolvedDetectMediaType(
          file,
          this.mimeType
        );

      this.size =
        normalizeByteCount(
          file.size
        );

      this.totalBytes =
        this.size;

      this.lastModified =
        resolveLastModified(
          file
        );

      this.basicFingerprint =
        createBasicFingerprint(
          file
        );

      this.updatedAt =
        nowIsoString();

      return this;
    }

    transitionTo(
      nextStatus,
      options = {}
    ) {
      const normalizedNextStatus =
        normalizeUploadStatus(
          nextStatus
        );

      const previousStatus =
        this.status;

      if (
        previousStatus ===
        normalizedNextStatus
      ) {
        if (
          options.metadata &&
          resolvedIsObject(
            options.metadata
          )
        ) {
          this.metadata = {
            ...this.metadata,
            ...resolvedDeepClone(
              options.metadata
            )
          };
        }

        this.updatedAt =
          nowIsoString();

        return this;
      }

      if (
        !options.force &&
        !canTransitionUploadStatus(
          previousStatus,
          normalizedNextStatus
        )
      ) {
        throw createUploadError(
          `Upload status cannot transition from "${previousStatus}" to "${normalizedNextStatus}".`,
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_TRANSITION,

            details: {
              itemId:
                this.id,

              previousStatus,

              nextStatus:
                normalizedNextStatus
            }
          }
        );
      }

      const timestamp =
        nowIsoString();

      this.status =
        normalizedNextStatus;

      this.updatedAt =
        timestamp;

      if (
        normalizedNextStatus ===
        UPLOAD_STATUS.QUEUED
      ) {
        this.queuedAt =
          timestamp;
      }

      if (
        normalizedNextStatus ===
          UPLOAD_STATUS.UPLOADING &&
        !this.startedAt
      ) {
        this.startedAt =
          timestamp;
      }

      if (
        normalizedNextStatus ===
        UPLOAD_STATUS.PAUSED
      ) {
        this.pausedAt =
          timestamp;
      }

      if (
        normalizedNextStatus ===
        UPLOAD_STATUS.COMPLETED
      ) {
        this.completedAt =
          timestamp;

        this.progress =
          100;

        this.uploadedBytes =
          this.totalBytes;

        this.error =
          null;
      }

      if (
        normalizedNextStatus ===
        UPLOAD_STATUS.FAILED
      ) {
        this.failedAt =
          timestamp;
      }

      if (
        normalizedNextStatus ===
        UPLOAD_STATUS.CANCELED
      ) {
        this.canceledAt =
          timestamp;
      }

      if (
        normalizedNextStatus ===
        UPLOAD_STATUS.REMOVED
      ) {
        this.removedAt =
          timestamp;
      }

      if (
        options.error
      ) {
        this.error =
          resolvedNormalizeError(
            options.error
          );
      } else if (
        normalizedNextStatus !==
        UPLOAD_STATUS.FAILED
      ) {
        this.error =
          null;
      }

      if (
        options.warning
      ) {
        this.warning =
          resolvedNormalizeError(
            options.warning,
            "An upload warning occurred."
          );
      }

      if (
        options.metadata &&
        resolvedIsObject(
          options.metadata
        )
      ) {
        this.metadata = {
          ...this.metadata,
          ...resolvedDeepClone(
            options.metadata
          )
        };
      }

      this.recordHistory(
        normalizedNextStatus,
        previousStatus,
        options.reason,
        options.metadata
      );

      return this;
    }

    setProgress(
      progress,
      options = {}
    ) {
      const normalizedProgress =
        normalizeProgress(
          progress
        );

      const timestamp =
        nowIsoString();

      this.progress =
        normalizedProgress;

      if (
        options.uploadedBytes !==
        undefined
      ) {
        this.uploadedBytes =
          Math.min(
            this.totalBytes,
            normalizeByteCount(
              options.uploadedBytes
            )
          );
      } else if (
        this.totalBytes > 0
      ) {
        this.uploadedBytes =
          Math.min(
            this.totalBytes,
            Math.round(
              this.totalBytes *
              (
                normalizedProgress /
                100
              )
            )
          );
      }

      if (
        options.totalBytes !==
        undefined
      ) {
        this.totalBytes =
          normalizeByteCount(
            options.totalBytes
          );

        this.uploadedBytes =
          Math.min(
            this.uploadedBytes,
            this.totalBytes
          );
      }

      if (
        options.bytesPerSecond !==
        undefined
      ) {
        this.bytesPerSecond =
          Math.max(
            0,
            resolvedSafeNumber(
              options.bytesPerSecond,
              0
            )
          );
      } else if (
        this.startedAt
      ) {
        this.bytesPerSecond =
          calculateUploadSpeed(
            this.uploadedBytes,
            this.startedAt
          );
      }

      this.estimatedSecondsRemaining =
        calculateEstimatedSecondsRemaining(
          this.totalBytes,
          this.uploadedBytes,
          this.bytesPerSecond
        );

      this.lastProgressAt =
        timestamp;

      this.updatedAt =
        timestamp;

      if (
        normalizedProgress >= 100 &&
        options.complete === true
      ) {
        this.transitionTo(
          UPLOAD_STATUS.COMPLETED,
          {
            reason:
              options.reason ||
              "upload-progress-completed"
          }
        );
      }

      return this;
    }

    recalculateProgress() {
      if (
        this.totalBytes > 0
      ) {
        this.progress =
          normalizeProgress(
            (
              this.uploadedBytes /
              this.totalBytes
            ) *
            100
          );
      }

      if (
        this.status ===
        UPLOAD_STATUS.COMPLETED
      ) {
        this.progress =
          100;

        this.uploadedBytes =
          this.totalBytes;
      }

      return this.progress;
    }

    markAttempt() {
      this.attempt +=
        1;

      this.updatedAt =
        nowIsoString();

      return this.attempt;
    }

    setFingerprint(
      fingerprintData
    ) {
      if (
        !resolvedIsObject(
          fingerprintData
        )
      ) {
        return this;
      }

      this.fingerprint =
        resolvedSafeString(
          fingerprintData.fingerprint,
          this.fingerprint
        );

      this.basicFingerprint =
        resolvedSafeString(
          fingerprintData.basicFingerprint,
          this.basicFingerprint
        );

      this.hashAlgorithm =
        resolvedSafeString(
          fingerprintData.algorithm,
          this.hashAlgorithm
        );

      this.hash =
        resolvedSafeString(
          fingerprintData.hash,
          this.hash
        );

      this.metadata = {
        ...this.metadata,

        fingerprint: {
          sampledBytes:
            normalizeByteCount(
              fingerprintData.sampledBytes
            ),

          totalFileBytes:
            normalizeByteCount(
              fingerprintData.totalFileBytes
            ),

          createdAt:
            normalizeTimestamp(
              fingerprintData.createdAt
            )
        }
      };

      this.updatedAt =
        nowIsoString();

      return this;
    }

    setDuplicate(
      duplicateData
    ) {
      this.duplicate =
        duplicateData &&
        resolvedIsObject(
          duplicateData
        )
          ? resolvedDeepClone(
              duplicateData
            )
          : null;

      this.updatedAt =
        nowIsoString();

      return this;
    }

    setRemoteResult(
      result
    ) {
      if (
        !resolvedIsObject(
          result
        )
      ) {
        return this;
      }

      this.remoteUploadId =
        resolvedSafeString(
          result.uploadId ||
          result.remoteUploadId,
          this.remoteUploadId
        );

      this.remoteMediaId =
        resolvedSafeString(
          result.mediaId ||
          result.id ||
          result.remoteMediaId,
          this.remoteMediaId
        );

      this.remoteUrl =
        resolvedSafeString(
          result.url ||
          result.mediaUrl ||
          result.remoteUrl,
          this.remoteUrl
        );

      this.thumbnailUrl =
        resolvedSafeString(
          result.thumbnailUrl ||
          result.previewUrl,
          this.thumbnailUrl
        );

      this.metadata = {
        ...this.metadata,
        remoteResult:
          resolvedDeepClone(
            result
          )
      };

      this.updatedAt =
        nowIsoString();

      return this;
    }

    setError(
      error
    ) {
      this.error =
        resolvedNormalizeError(
          error
        );

      this.updatedAt =
        nowIsoString();

      return this;
    }

    clearError() {
      this.error =
        null;

      this.warning =
        null;

      this.updatedAt =
        nowIsoString();

      return this;
    }

    recordHistory(
      status,
      previousStatus,
      reason = "",
      metadata = {}
    ) {
      this.history.push({
        status:
          normalizeUploadStatus(
            status,
            this.status
          ),

        previousStatus:
          previousStatus
            ? normalizeUploadStatus(
                previousStatus
              )
            : null,

        timestamp:
          nowIsoString(),

        reason:
          resolvedSafeString(
            reason
          ),

        metadata:
          resolvedIsObject(
            metadata
          )
            ? resolvedDeepClone(
                metadata
              )
            : {}
      });

      if (
        this.history.length >
        DEFAULT_QUEUE_HISTORY_LIMIT
      ) {
        this.history =
          this.history.slice(
            -DEFAULT_QUEUE_HISTORY_LIMIT
          );
      }

      return this;
    }

    toJSON() {
      return {
        id:
          this.id,

        name:
          this.name,

        originalName:
          this.originalName,

        relativePath:
          this.relativePath,

        extension:
          this.extension,

        mimeType:
          this.mimeType,

        mediaType:
          this.mediaType,

        size:
          this.size,

        lastModified:
          this.lastModified,

        fileAvailable:
          this.fileAvailable,

        classId:
          this.classId,

        folderId:
          this.folderId,

        source:
          this.source,

        priority:
          this.priority,

        status:
          this.status,

        progress:
          this.progress,

        uploadedBytes:
          this.uploadedBytes,

        totalBytes:
          this.totalBytes,

        bytesPerSecond:
          this.bytesPerSecond,

        estimatedSecondsRemaining:
          this.estimatedSecondsRemaining,

        attempt:
          this.attempt,

        maximumAttempts:
          this.maximumAttempts,

        fingerprint:
          this.fingerprint,

        basicFingerprint:
          this.basicFingerprint,

        hashAlgorithm:
          this.hashAlgorithm,

        hash:
          this.hash,

        remoteUploadId:
          this.remoteUploadId,

        remoteMediaId:
          this.remoteMediaId,

        remoteUrl:
          this.remoteUrl,

        thumbnailUrl:
          this.thumbnailUrl,

        metadata:
          resolvedDeepClone(
            this.metadata
          ),

        tags:
          [...this.tags],

        error:
          this.error
            ? resolvedDeepClone(
                this.error
              )
            : null,

        warning:
          this.warning
            ? resolvedDeepClone(
                this.warning
              )
            : null,

        duplicate:
          this.duplicate
            ? resolvedDeepClone(
                this.duplicate
              )
            : null,

        createdAt:
          this.createdAt,

        updatedAt:
          this.updatedAt,

        queuedAt:
          this.queuedAt,

        startedAt:
          this.startedAt,

        pausedAt:
          this.pausedAt,

        completedAt:
          this.completedAt,

        failedAt:
          this.failedAt,

        canceledAt:
          this.canceledAt,

        removedAt:
          this.removedAt,

        lastProgressAt:
          this.lastProgressAt,

        history:
          resolvedDeepClone(
            this.history
          )
      };
    }

    toPublicJSON() {
      const serializedItem =
        this.toJSON();

      delete serializedItem.hash;
      delete serializedItem.history;

      return serializedItem;
    }

    static restore(
      restoredData
    ) {
      return new UploadQueueItem(
        null,
        {
          restoredData,
          source:
            UPLOAD_SOURCE.RESTORED
        }
      );
    }
  }

  /* =========================================================
     UPLOAD QUEUE STORE
  ========================================================= */

  class UploadQueueStore {
    constructor(
      options = {}
    ) {
      this.eventBus =
        options.eventBus ||
        eventBus;

      this.applicationStore =
        options.applicationStore ||
        store;

      this.notifications =
        options.notifications ||
        notifications;

      this.fingerprintService =
        options.fingerprintService ||
        new UploadFingerprintService();

      this.storageKey =
        resolvedSafeString(
          options.storageKey,
          UPLOAD_STORAGE_KEY
        );

      this.maximumQueueItems =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumQueueItems,
            DEFAULT_MAXIMUM_QUEUE_ITEMS
          )
        );

      this.maximumFileSizeBytes =
        Math.max(
          DEFAULT_MINIMUM_FILE_SIZE_BYTES,
          resolvedSafeInteger(
            options.maximumFileSizeBytes,
            DEFAULT_MAXIMUM_FILE_SIZE_BYTES
          )
        );

      this.minimumFileSizeBytes =
        Math.max(
          0,
          resolvedSafeInteger(
            options.minimumFileSizeBytes,
            DEFAULT_MINIMUM_FILE_SIZE_BYTES
          )
        );

      this.persistDebounceMilliseconds =
        Math.max(
          0,
          resolvedSafeInteger(
            options.persistDebounceMilliseconds,
            DEFAULT_PERSIST_DEBOUNCE_MS
          )
        );

      this.allowedMediaTypes =
        new Set(
          resolvedNormalizeArray(
            options.allowedMediaTypes
          )
            .map(
              value =>
                resolvedSafeString(
                  value
                ).toLowerCase()
            )
            .filter(
              Boolean
            )
        );

      this.allowedMimeTypes =
        new Set(
          resolvedNormalizeArray(
            options.allowedMimeTypes
          )
            .map(
              value =>
                resolvedSafeString(
                  value
                ).toLowerCase()
            )
            .filter(
              Boolean
            )
        );

      this.blockedExtensions =
        new Set(
          resolvedNormalizeArray(
            options.blockedExtensions
          )
            .map(
              value =>
                resolvedSafeString(
                  value
                )
                  .replace(
                    /^\./,
                    ""
                  )
                  .toLowerCase()
            )
            .filter(
              Boolean
            )
        );

      this.items =
        new Map();

      this.order =
        [];

      this.subscribers =
        new Set();

      this.persistTimer =
        null;

      this.lastPersistedAt =
        null;

      this.lastChangeAt =
        null;

      this.lastAddedFingerprint =
        "";

      this.lastAddedTimestamp =
        0;

      this.destroyed =
        false;

      this.restored =
        false;

      this.synchronizeApplicationState(
        "upload-queue-created"
      );
    }

    get size() {
      return this.order.length;
    }

    get activeCount() {
      return this.getItems()
        .filter(
          item =>
            item.isActive()
        )
        .length;
    }

    get pendingCount() {
      return this.getItems()
        .filter(
          item =>
            item.isPending()
        )
        .length;
    }

    get completedCount() {
      return this.getItems()
        .filter(
          item =>
            item.status ===
            UPLOAD_STATUS.COMPLETED
        )
        .length;
    }

    get failedCount() {
      return this.getItems()
        .filter(
          item =>
            item.status ===
            UPLOAD_STATUS.FAILED
        )
        .length;
    }

    get totalBytes() {
      return this.getItems()
        .reduce(
          (
            total,
            item
          ) =>
            total +
            item.totalBytes,
          0
        );
    }

    get uploadedBytes() {
      return this.getItems()
        .reduce(
          (
            total,
            item
          ) =>
            total +
            item.uploadedBytes,
          0
        );
    }

    get overallProgress() {
      const totalBytes =
        this.totalBytes;

      if (
        totalBytes <= 0
      ) {
        return 0;
      }

      return normalizeProgress(
        (
          this.uploadedBytes /
          totalBytes
        ) *
        100
      );
    }

    assertAvailable() {
      if (
        this.destroyed
      ) {
        throw createUploadError(
          "The upload queue has been destroyed.",
          {
            code:
              UPLOAD_ERROR_CODE.UNKNOWN
          }
        );
      }
    }

    validateFile(
      file
    ) {
      if (
        !isBlobObject(
          file
        )
      ) {
        throw createUploadError(
          "The selected item is not a valid file.",
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_FILE
          }
        );
      }

      const fileSize =
        normalizeByteCount(
          file.size
        );

      if (
        fileSize <
        this.minimumFileSizeBytes
      ) {
        throw createUploadError(
          "The selected file is empty and cannot be uploaded.",
          {
            code:
              UPLOAD_ERROR_CODE.EMPTY_FILE,

            details: {
              name:
                resolveFileName(
                  file
                ),

              size:
                fileSize
            }
          }
        );
      }

      if (
        fileSize >
        this.maximumFileSizeBytes
      ) {
        throw createUploadError(
          `The selected file is larger than the ${formatFileSize ? formatFileSize(this.maximumFileSizeBytes) : this.maximumFileSizeBytes + " bytes"} upload limit.`,
          {
            code:
              UPLOAD_ERROR_CODE.FILE_TOO_LARGE,

            details: {
              name:
                resolveFileName(
                  file
                ),

              size:
                fileSize,

              maximumSize:
                this.maximumFileSizeBytes
            }
          }
        );
      }

      const extension =
        resolvedGetFileExtension(
          resolveFileName(
            file
          )
        );

      if (
        extension &&
        this.blockedExtensions.has(
          extension
        )
      ) {
        throw createUploadError(
          `Files with the .${extension} extension are not allowed.`,
          {
            code:
              UPLOAD_ERROR_CODE.UNSUPPORTED_TYPE,

            details: {
              extension
            }
          }
        );
      }

      const mediaType =
        resolvedDetectMediaType(
          file,
          file.type
        );

      if (
        this.allowedMediaTypes.size &&
        !this.allowedMediaTypes.has(
          mediaType
        )
      ) {
        throw createUploadError(
          `The selected ${mediaType} file type is not allowed.`,
          {
            code:
              UPLOAD_ERROR_CODE.UNSUPPORTED_TYPE,

            details: {
              mediaType
            }
          }
        );
      }

      const mimeType =
        resolvedSafeString(
          file.type
        ).toLowerCase();

      if (
        this.allowedMimeTypes.size &&
        mimeType &&
        !this.allowedMimeTypes.has(
          mimeType
        )
      ) {
        throw createUploadError(
          `The selected MIME type "${mimeType}" is not allowed.`,
          {
            code:
              UPLOAD_ERROR_CODE.UNSUPPORTED_TYPE,

            details: {
              mimeType
            }
          }
        );
      }

      return {
        valid:
          true,

        name:
          resolveFileName(
            file
          ),

        size:
          fileSize,

        extension,

        mimeType,

        mediaType
      };
    }

    has(
      itemId
    ) {
      return this.items.has(
        resolvedSafeString(
          itemId
        )
      );
    }

    get(
      itemId
    ) {
      return this.items.get(
        resolvedSafeString(
          itemId
        )
      ) ||
      null;
    }

    getItems(
      options = {}
    ) {
      let items =
        this.order
          .map(
            itemId =>
              this.items.get(
                itemId
              )
          )
          .filter(
            Boolean
          );

      if (
        options.status
      ) {
        const statuses =
          new Set(
            resolvedNormalizeArray(
              options.status
            )
              .map(
                status =>
                  normalizeUploadStatus(
                    status
                  )
              )
          );

        items =
          items.filter(
            item =>
              statuses.has(
                item.status
              )
          );
      }

      if (
        options.mediaType
      ) {
        const mediaTypes =
          new Set(
            resolvedNormalizeArray(
              options.mediaType
            )
              .map(
                value =>
                  resolvedSafeString(
                    value
                  ).toLowerCase()
              )
              .filter(
                Boolean
              )
          );

        items =
          items.filter(
            item =>
              mediaTypes.has(
                item.mediaType
              )
          );
      }

      if (
        options.classId
      ) {
        const classId =
          resolvedSafeString(
            options.classId
          );

        items =
          items.filter(
            item =>
              item.classId ===
              classId
          );
      }

      if (
        options.includeRemoved !==
        true
      ) {
        items =
          items.filter(
            item =>
              item.status !==
              UPLOAD_STATUS.REMOVED
          );
      }

      if (
        options.sort !== false
      ) {
        items =
          this.sortItems(
            items
          );
      }

      return items;
    }

    getSerializableItems(
      options = {}
    ) {
      return this.getItems({
        ...options,
        sort:
          false
      }).map(
        item =>
          item.toJSON()
      );
    }

    sortItems(
      items
    ) {
      return [...items]
        .sort(
          (
            firstItem,
            secondItem
          ) => {
            const firstPriority =
              UPLOAD_PRIORITY_WEIGHT[
                firstItem.priority
              ] ||
              0;

            const secondPriority =
              UPLOAD_PRIORITY_WEIGHT[
                secondItem.priority
              ] ||
              0;

            if (
              firstPriority !==
              secondPriority
            ) {
              return secondPriority -
                firstPriority;
            }

            const firstCreatedAt =
              Date.parse(
                firstItem.createdAt
              ) ||
              0;

            const secondCreatedAt =
              Date.parse(
                secondItem.createdAt
              ) ||
              0;

            return firstCreatedAt -
              secondCreatedAt;
          }
        );
    }

    findByFingerprint(
      fingerprint
    ) {
      const normalizedFingerprint =
        resolvedSafeString(
          fingerprint
        );

      if (
        !normalizedFingerprint
      ) {
        return null;
      }

      return this.getItems({
        includeRemoved:
          true,
        sort:
          false
      }).find(
        item =>
          item.fingerprint ===
            normalizedFingerprint ||
          item.basicFingerprint ===
            normalizedFingerprint
      ) ||
      null;
    }

    findDuplicateFile(
      file
    ) {
      const basicFingerprint =
        createBasicFingerprint(
          file
        );

      return this.findByFingerprint(
        basicFingerprint
      );
    }

    async add(
      file,
      options = {}
    ) {
      this.assertAvailable();

      if (
        this.size >=
        this.maximumQueueItems
      ) {
        throw createUploadError(
          `The upload queue can contain no more than ${this.maximumQueueItems} items.`,
          {
            code:
              UPLOAD_ERROR_CODE.QUEUE_FULL
          }
        );
      }

      const validationResult =
        this.validateFile(
          file
        );

      const basicFingerprint =
        createBasicFingerprint(
          file
        );

      const currentTimestamp =
        Date.now();

      const recentlyAddedDuplicate =
        (
          basicFingerprint ===
            this.lastAddedFingerprint &&
          currentTimestamp -
            this.lastAddedTimestamp <
            DEFAULT_DUPLICATE_WINDOW_MS
        );

      const existingDuplicate =
        this.findByFingerprint(
          basicFingerprint
        );

      if (
        (
          recentlyAddedDuplicate ||
          existingDuplicate
        ) &&
        options.allowDuplicate !==
          true
      ) {
        const duplicateItem =
          existingDuplicate ||
          null;

        this.emit(
          UPLOAD_EVENTS.DUPLICATE_DETECTED,
          {
            fingerprint:
              basicFingerprint,

            duplicateItem:
              duplicateItem
                ? duplicateItem.toPublicJSON()
                : null,

            file: {
              name:
                validationResult.name,

              size:
                validationResult.size,

              mimeType:
                validationResult.mimeType
            }
          }
        );

        throw createUploadError(
          `"${validationResult.name}" is already in the upload queue.`,
          {
            code:
              UPLOAD_ERROR_CODE.DUPLICATE,

            details: {
              existingItemId:
                duplicateItem?.id ||
                null,

              fingerprint:
                basicFingerprint
            }
          }
        );
      }

      const item =
        new UploadQueueItem(
          file,
          {
            ...options,

            classId:
              options.classId ||
              resolveClassId(),

            basicFingerprint,

            status:
              UPLOAD_STATUS.CREATED
          }
        );

      this.items.set(
        item.id,
        item
      );

      this.order.push(
        item.id
      );

      this.lastAddedFingerprint =
        basicFingerprint;

      this.lastAddedTimestamp =
        currentTimestamp;

      this.emit(
        UPLOAD_EVENTS.ITEM_CREATED,
        {
          item:
            item.toPublicJSON()
        }
      );

      try {
        item.transitionTo(
          UPLOAD_STATUS.VALIDATING,
          {
            reason:
              "queue-validation-started"
          }
        );

        this.emitStatusChange(
          item,
          UPLOAD_STATUS.CREATED
        );

        if (
          options.generateFingerprint !==
          false
        ) {
          await this.generateFingerprint(
            item.id,
            {
              rejectDuplicates:
                options.allowDuplicate !==
                true
            }
          );
        }

        if (
          item.status ===
          UPLOAD_STATUS.REJECTED
        ) {
          this.notifyChange(
            "upload-item-rejected",
            item
          );

          return item;
        }

        const previousStatus =
          item.status;

        item.transitionTo(
          UPLOAD_STATUS.QUEUED,
          {
            reason:
              "upload-added-to-queue"
          }
        );

        this.emitStatusChange(
          item,
          previousStatus
        );

        this.emit(
          UPLOAD_EVENTS.ITEM_ADDED,
          {
            item:
              item.toPublicJSON()
          }
        );

        this.notifyChange(
          "upload-item-added",
          item
        );

        return item;
      } catch (
        addError
      ) {
        const normalizedError =
          resolvedNormalizeError(
            addError
          );

        const previousStatus =
          item.status;

        if (
          addError?.code ===
          UPLOAD_ERROR_CODE.DUPLICATE
        ) {
          item.transitionTo(
            UPLOAD_STATUS.REJECTED,
            {
              force:
                true,

              reason:
                "duplicate-rejected",

              error:
                normalizedError
            }
          );

          this.emit(
            UPLOAD_EVENTS.ITEM_REJECTED,
            {
              item:
                item.toPublicJSON(),

              error:
                normalizedError
            }
          );
        } else {
          item.transitionTo(
            UPLOAD_STATUS.FAILED,
            {
              force:
                true,

              reason:
                "queue-add-failed",

              error:
                normalizedError
            }
          );

          this.emit(
            UPLOAD_EVENTS.ITEM_FAILED,
            {
              item:
                item.toPublicJSON(),

              error:
                normalizedError
            }
          );
        }

        this.emitStatusChange(
          item,
          previousStatus
        );

        this.notifyChange(
          "upload-item-add-failed",
          item
        );

        throw addError;
      }
    }

    async addMany(
      files,
      options = {}
    ) {
      const normalizedFiles =
        Array.from(
          files ||
          []
        );

      const result = {
        added:
          [],

        rejected:
          [],

        total:
          normalizedFiles.length
      };

      for (
        const file
        of normalizedFiles
      ) {
        try {
          const item =
            await this.add(
              file,
              options
            );

          result.added.push(
            item
          );
        } catch (
          addError
        ) {
          result.rejected.push({
            file,

            error:
              resolvedNormalizeError(
                addError
              )
          });

          if (
            options.stopOnError ===
            true
          ) {
            break;
          }
        }
      }

      return result;
    }

    async generateFingerprint(
      itemId,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      if (
        item.fingerprint &&
        options.force !==
        true
      ) {
        return {
          fingerprint:
            item.fingerprint,

          basicFingerprint:
            item.basicFingerprint,

          algorithm:
            item.hashAlgorithm,

          hash:
            item.hash
        };
      }

      if (
        !item.hasFile()
      ) {
        throw createUploadError(
          `The file for "${item.name}" is no longer available. Select the file again before uploading.`,
          {
            code:
              UPLOAD_ERROR_CODE.FILE_UNAVAILABLE,

            details: {
              itemId:
                item.id
            }
          }
        );
      }

      const previousStatus =
        item.status;

      item.transitionTo(
        UPLOAD_STATUS.HASHING,
        {
          force:
            true,

          reason:
            "fingerprint-started"
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.emit(
        UPLOAD_EVENTS.FINGERPRINT_STARTED,
        {
          item:
            item.toPublicJSON()
        }
      );

      try {
        const fingerprintData =
          await this.fingerprintService
            .create(
              item.file,
              options
            );

        const duplicateItem =
          this.getItems({
            includeRemoved:
              true,
            sort:
              false
          }).find(
            candidate =>
              candidate.id !==
                item.id &&
              (
                candidate.fingerprint ===
                  fingerprintData.fingerprint ||
                candidate.basicFingerprint ===
                  fingerprintData.basicFingerprint
              ) &&
              candidate.status !==
                UPLOAD_STATUS.REMOVED
          );

        item.setFingerprint(
          fingerprintData
        );

        if (
          duplicateItem &&
          options.rejectDuplicates !==
          false
        ) {
          item.setDuplicate({
            type:
              "queue",

            itemId:
              duplicateItem.id,

            name:
              duplicateItem.name,

            status:
              duplicateItem.status,

            detectedAt:
              nowIsoString()
          });

          const hashingStatus =
            item.status;

          item.transitionTo(
            UPLOAD_STATUS.REJECTED,
            {
              force:
                true,

              reason:
                "fingerprint-duplicate-detected",

              error:
                createUploadError(
                  `"${item.name}" duplicates another item in the upload queue.`,
                  {
                    code:
                      UPLOAD_ERROR_CODE.DUPLICATE,

                    details: {
                      existingItemId:
                        duplicateItem.id
                    }
                  }
                )
            }
          );

          this.emitStatusChange(
            item,
            hashingStatus
          );

          this.emit(
            UPLOAD_EVENTS.DUPLICATE_DETECTED,
            {
              item:
                item.toPublicJSON(),

              duplicateItem:
                duplicateItem
                  .toPublicJSON()
            }
          );

          this.emit(
            UPLOAD_EVENTS.ITEM_REJECTED,
            {
              item:
                item.toPublicJSON(),

              error:
                item.error
            }
          );

          this.notifyChange(
            "upload-fingerprint-duplicate",
            item
          );

          throw createUploadError(
            `"${item.name}" is already in the upload queue.`,
            {
              code:
                UPLOAD_ERROR_CODE.DUPLICATE,

              details: {
                existingItemId:
                  duplicateItem.id
              }
            }
          );
        }

        this.emit(
          UPLOAD_EVENTS.FINGERPRINT_COMPLETED,
          {
            item:
              item.toPublicJSON(),

            fingerprint:
              resolvedDeepClone(
                fingerprintData
              )
          }
        );

        this.notifyChange(
          "upload-fingerprint-created",
          item
        );

        return fingerprintData;
      } catch (
        fingerprintError
      ) {
        if (
          fingerprintError?.code ===
          UPLOAD_ERROR_CODE.DUPLICATE
        ) {
          throw fingerprintError;
        }

        const normalizedError =
          resolvedNormalizeError(
            fingerprintError,
            "The file fingerprint could not be created."
          );

        const currentStatus =
          item.status;

        item.transitionTo(
          UPLOAD_STATUS.FAILED,
          {
            force:
              true,

            reason:
              "fingerprint-failed",

            error:
              normalizedError
          }
        );

        this.emitStatusChange(
          item,
          currentStatus
        );

        this.emit(
          UPLOAD_EVENTS.FINGERPRINT_FAILED,
          {
            item:
              item.toPublicJSON(),

            error:
              normalizedError
          }
        );

        this.notifyChange(
          "upload-fingerprint-failed",
          item
        );

        throw createUploadError(
          normalizedError.message,
          {
            code:
              normalizedError.code ||
              UPLOAD_ERROR_CODE.HASH_FAILED,

            cause:
              fingerprintError
          }
        );
      }
    }

    update(
      itemId,
      updates = {},
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      if (
        updates.name !==
        undefined
      ) {
        item.name =
          resolvedSafeString(
            updates.name,
            item.name
          );
      }

      if (
        updates.folderId !==
        undefined
      ) {
        item.folderId =
          resolvedSafeString(
            updates.folderId
          );
      }

      if (
        updates.classId !==
        undefined
      ) {
        item.classId =
          resolvedSafeString(
            updates.classId
          );
      }

      if (
        updates.priority !==
        undefined
      ) {
        item.priority =
          normalizeUploadPriority(
            updates.priority
          );
      }

      if (
        updates.tags !==
        undefined
      ) {
        item.tags =
          Array.from(
            new Set(
              resolvedNormalizeArray(
                updates.tags
              )
                .map(
                  tag =>
                    resolvedSafeString(
                      tag
                    )
                )
                .filter(
                  Boolean
                )
            )
          );
      }

      if (
        updates.metadata !==
        undefined &&
        resolvedIsObject(
          updates.metadata
        )
      ) {
        item.metadata = {
          ...item.metadata,
          ...resolvedDeepClone(
            updates.metadata
          )
        };
      }

      if (
        updates.file
      ) {
        item.setFile(
          updates.file
        );
      }

      if (
        updates.status !==
        undefined
      ) {
        const previousStatus =
          item.status;

        item.transitionTo(
          updates.status,
          {
            force:
              options.force ===
              true,

            reason:
              options.reason ||
              "upload-item-updated",

            metadata:
              options.metadata
          }
        );

        this.emitStatusChange(
          item,
          previousStatus
        );
      }

      item.updatedAt =
        nowIsoString();

      this.emit(
        UPLOAD_EVENTS.ITEM_UPDATED,
        {
          item:
            item.toPublicJSON(),

          updates:
            resolvedDeepClone(
              updates
            )
        }
      );

      this.notifyChange(
        options.reason ||
        "upload-item-updated",
        item
      );

      return item;
    }

    setStatus(
      itemId,
      status,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      const previousStatus =
        item.status;

      item.transitionTo(
        status,
        options
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.notifyChange(
        options.reason ||
        "upload-status-changed",
        item
      );

      return item;
    }

    setProgress(
      itemId,
      progress,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      item.setProgress(
        progress,
        options
      );

      this.emit(
        UPLOAD_EVENTS.ITEM_PROGRESS,
        {
          item:
            item.toPublicJSON(),

          progress:
            item.progress,

          uploadedBytes:
            item.uploadedBytes,

          totalBytes:
            item.totalBytes,

          bytesPerSecond:
            item.bytesPerSecond,

          estimatedSecondsRemaining:
            item
              .estimatedSecondsRemaining
        }
      );

      this.notifyChange(
        "upload-progress-changed",
        item,
        {
          persist:
            options.persist !==
            false,

          notifySubscribers:
            options.notifySubscribers !==
            false
        }
      );

      return item;
    }

    pause(
      itemId,
      options = {}
    ) {
      const item =
        this.setStatus(
          itemId,
          UPLOAD_STATUS.PAUSED,
          {
            ...options,
            reason:
              options.reason ||
              "upload-paused"
          }
        );

      this.emit(
        UPLOAD_EVENTS.ITEM_PAUSED,
        {
          item:
            item.toPublicJSON()
        }
      );

      return item;
    }

    resume(
      itemId,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      const nextStatus =
        options.status
          ? normalizeUploadStatus(
              options.status
            )
          : UPLOAD_STATUS.QUEUED;

      const previousStatus =
        item.status;

      item.transitionTo(
        nextStatus,
        {
          reason:
            options.reason ||
            "upload-resumed",

          force:
            options.force ===
            true
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.emit(
        UPLOAD_EVENTS.ITEM_RESUMED,
        {
          item:
            item.toPublicJSON()
        }
      );

      this.notifyChange(
        "upload-resumed",
        item
      );

      return item;
    }

    retry(
      itemId,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      if (
        !item.isRetryable() &&
        options.force !==
          true
      ) {
        throw createUploadError(
          `"${item.name}" cannot be retried.`,
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_TRANSITION,

            details: {
              itemId:
                item.id,

              status:
                item.status,

              attempt:
                item.attempt,

              maximumAttempts:
                item.maximumAttempts
            }
          }
        );
      }

      item.clearError();

      const previousStatus =
        item.status;

      item.transitionTo(
        UPLOAD_STATUS.QUEUED,
        {
          force:
            options.force ===
            true,

          reason:
            options.reason ||
            "upload-retry-requested"
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.emit(
        UPLOAD_EVENTS.ITEM_RETRY_REQUESTED,
        {
          item:
            item.toPublicJSON()
        }
      );

      this.notifyChange(
        "upload-retry-requested",
        item
      );

      return item;
    }

    cancel(
      itemId,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      if (
        item.status ===
          UPLOAD_STATUS.COMPLETED &&
        options.force !==
          true
      ) {
        return item;
      }

      const previousStatus =
        item.status;

      item.transitionTo(
        UPLOAD_STATUS.CANCELED,
        {
          force:
            options.force ===
            true,

          reason:
            options.reason ||
            "upload-canceled",

          error:
            createUploadError(
              "The upload was canceled.",
              {
                code:
                  UPLOAD_ERROR_CODE.CANCELED
              }
            )
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.emit(
        UPLOAD_EVENTS.ITEM_CANCELED,
        {
          item:
            item.toPublicJSON()
        }
      );

      this.notifyChange(
        "upload-canceled",
        item
      );

      return item;
    }

    complete(
      itemId,
      result = {},
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      item.setRemoteResult(
        result
      );

      const previousStatus =
        item.status;

      item.transitionTo(
        UPLOAD_STATUS.COMPLETED,
        {
          force:
            options.force ===
            true,

          reason:
            options.reason ||
            "upload-completed",

          metadata: {
            completedResult:
              resolvedDeepClone(
                result
              )
          }
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.emit(
        UPLOAD_EVENTS.ITEM_COMPLETED,
        {
          item:
            item.toPublicJSON(),

          result:
            resolvedDeepClone(
              result
            )
        }
      );

      this.notifyChange(
        "upload-completed",
        item
      );

      return item;
    }

    fail(
      itemId,
      error,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      const normalizedError =
        resolvedNormalizeError(
          error
        );

      const previousStatus =
        item.status;

      item.transitionTo(
        UPLOAD_STATUS.FAILED,
        {
          force:
            options.force ===
            true,

          reason:
            options.reason ||
            "upload-failed",

          error:
            normalizedError
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.emit(
        UPLOAD_EVENTS.ITEM_FAILED,
        {
          item:
            item.toPublicJSON(),

          error:
            normalizedError
        }
      );

      this.notifyChange(
        "upload-failed",
        item
      );

      return item;
    }

    remove(
      itemId,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      if (
        item.isActive() &&
        options.force !==
          true
      ) {
        throw createUploadError(
          `"${item.name}" is currently active. Cancel it before removing it.`,
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_TRANSITION,

            details: {
              itemId:
                item.id,

              status:
                item.status
            }
          }
        );
      }

      const previousStatus =
        item.status;

      item.transitionTo(
        UPLOAD_STATUS.REMOVED,
        {
          force:
            true,

          reason:
            options.reason ||
            "upload-item-removed"
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.items.delete(
        item.id
      );

      this.order =
        this.order.filter(
          queuedItemId =>
            queuedItemId !==
            item.id
        );

      if (
        item.file
      ) {
        this.fingerprintService
          .clear(
            item.file
          );
      }

      item.file =
        null;

      item.fileAvailable =
        false;

      this.emit(
        UPLOAD_EVENTS.ITEM_REMOVED,
        {
          item:
            item.toPublicJSON()
        }
      );

      this.notifyChange(
        "upload-item-removed",
        item
      );

      return item;
    }

    clear(
      options = {}
    ) {
      const includeActive =
        options.includeActive ===
        true;

      const statuses =
        options.status
          ? new Set(
              resolvedNormalizeArray(
                options.status
              )
                .map(
                  status =>
                    normalizeUploadStatus(
                      status
                    )
                )
            )
          : null;

      const removedItems =
        [];

      for (
        const item
        of this.getItems({
          includeRemoved:
            true,
          sort:
            false
        })
      ) {
        if (
          statuses &&
          !statuses.has(
            item.status
          )
        ) {
          continue;
        }

        if (
          item.isActive() &&
          !includeActive
        ) {
          continue;
        }

        try {
          removedItems.push(
            this.remove(
              item.id,
              {
                force:
                  includeActive,

                reason:
                  options.reason ||
                  "upload-queue-cleared"
              }
            )
          );
        } catch (
          removeError
        ) {
          console.warn(
            "[AIFT Media Library] Upload queue item could not be removed:",
            removeError
          );
        }
      }

      this.emit(
        UPLOAD_EVENTS.QUEUE_CLEARED,
        {
          removedCount:
            removedItems.length,

          remainingCount:
            this.size
        }
      );

      this.notifyChange(
        "upload-queue-cleared"
      );

      return removedItems;
    }

    trimCompleted(
      maximumCompletedItems =
        DEFAULT_RECENT_COMPLETED_LIMIT
    ) {
      const normalizedLimit =
        Math.max(
          0,
          resolvedSafeInteger(
            maximumCompletedItems,
            DEFAULT_RECENT_COMPLETED_LIMIT
          )
        );

      const completedItems =
        this.getItems({
          status:
            UPLOAD_STATUS.COMPLETED
        })
          .sort(
            (
              firstItem,
              secondItem
            ) =>
              (
                Date.parse(
                  secondItem.completedAt
                ) ||
                0
              ) -
              (
                Date.parse(
                  firstItem.completedAt
                ) ||
                0
              )
          );

      const itemsToRemove =
        completedItems.slice(
          normalizedLimit
        );

      for (
        const item
        of itemsToRemove
      ) {
        this.remove(
          item.id,
          {
            force:
              true,

            reason:
              "completed-history-trimmed"
          }
        );
      }

      return itemsToRemove.length;
    }

    replaceFile(
      itemId,
      file,
      options = {}
    ) {
      const item =
        this.requireItem(
          itemId
        );

      this.validateFile(
        file
      );

      item.setFile(
        file
      );

      if (
        options.resetProgress !==
        false
      ) {
        item.progress =
          0;

        item.uploadedBytes =
          0;

        item.bytesPerSecond =
          0;

        item.estimatedSecondsRemaining =
          null;

        item.startedAt =
          null;

        item.completedAt =
          null;

        item.failedAt =
          null;

        item.canceledAt =
          null;
      }

      item.fingerprint =
        "";

      item.hash =
        "";

      item.hashAlgorithm =
        "";

      item.duplicate =
        null;

      item.clearError();

      const previousStatus =
        item.status;

      item.transitionTo(
        UPLOAD_STATUS.QUEUED,
        {
          force:
            true,

          reason:
            options.reason ||
            "upload-file-replaced"
        }
      );

      this.emitStatusChange(
        item,
        previousStatus
      );

      this.emit(
        UPLOAD_EVENTS.ITEM_UPDATED,
        {
          item:
            item.toPublicJSON(),

          updates: {
            fileReplaced:
              true
          }
        }
      );

      this.notifyChange(
        "upload-file-replaced",
        item
      );

      return item;
    }

    requireItem(
      itemId
    ) {
      const item =
        this.get(
          itemId
        );

      if (
        !item
      ) {
        throw createUploadError(
          "The requested upload queue item could not be found.",
          {
            code:
              UPLOAD_ERROR_CODE.INVALID_FILE,

            details: {
              itemId:
                resolvedSafeString(
                  itemId
                )
            }
          }
        );
      }

      return item;
    }

    subscribe(
      callback
    ) {
      if (
        !resolvedIsFunction(
          callback
        )
      ) {
        throw new TypeError(
          "Upload queue subscriber must be a function."
        );
      }

      this.subscribers.add(
        callback
      );

      return () => {
        this.subscribers.delete(
          callback
        );
      };
    }

    notifySubscribers(
      reason,
      changedItem = null
    ) {
      const snapshot =
        this.getSnapshot();

      for (
        const subscriber
        of Array.from(
          this.subscribers
        )
      ) {
        try {
          subscriber(
            snapshot,
            {
              reason:
                resolvedSafeString(
                  reason
                ),

              changedItem:
                changedItem
                  ? changedItem
                      .toPublicJSON()
                  : null,

              timestamp:
                nowIsoString()
            }
          );
        } catch (
          subscriberError
        ) {
          console.error(
            "[AIFT Media Library] Upload queue subscriber failed:",
            subscriberError
          );
        }
      }
    }

    getSnapshot() {
      return {
        version:
          UPLOAD_QUEUE_VERSION,

        size:
          this.size,

        activeCount:
          this.activeCount,

        pendingCount:
          this.pendingCount,

        completedCount:
          this.completedCount,

        failedCount:
          this.failedCount,

        totalBytes:
          this.totalBytes,

        uploadedBytes:
          this.uploadedBytes,

        overallProgress:
          this.overallProgress,

        lastChangeAt:
          this.lastChangeAt,

        lastPersistedAt:
          this.lastPersistedAt,

        restored:
          this.restored,

        items:
          this.getItems()
            .map(
              item =>
                item.toPublicJSON()
            )
      };
    }

    emit(
      eventName,
      payload = {}
    ) {
      if (
        this.eventBus &&
        resolvedIsFunction(
          this.eventBus.emit
        )
      ) {
        this.eventBus.emit(
          eventName,
          {
            ...payload,

            queue:
              this.getQueueSummary(),

            timestamp:
              nowIsoString()
          }
        );
      }
    }

    emitStatusChange(
      item,
      previousStatus
    ) {
      this.emit(
        UPLOAD_EVENTS.ITEM_STATUS_CHANGED,
        {
          item:
            item.toPublicJSON(),

          previousStatus,

          status:
            item.status
        }
      );
    }

    getQueueSummary() {
      return {
        size:
          this.size,

        activeCount:
          this.activeCount,

        pendingCount:
          this.pendingCount,

        completedCount:
          this.completedCount,

        failedCount:
          this.failedCount,

        totalBytes:
          this.totalBytes,

        uploadedBytes:
          this.uploadedBytes,

        overallProgress:
          this.overallProgress
      };
    }

    notifyChange(
      reason,
      changedItem = null,
      options = {}
    ) {
      this.lastChangeAt =
        nowIsoString();

      this.synchronizeApplicationState(
        reason
      );

      if (
        options.notifySubscribers !==
        false
      ) {
        this.notifySubscribers(
          reason,
          changedItem
        );
      }

      this.emit(
        UPLOAD_EVENTS.QUEUE_CHANGED,
        {
          reason:
            resolvedSafeString(
              reason
            ),

          changedItem:
            changedItem
              ? changedItem
                  .toPublicJSON()
              : null
        }
      );

      if (
        options.persist !==
        false
      ) {
        this.schedulePersist();
      }
    }

    synchronizeApplicationState(
      reason
    ) {
      if (
        !this.applicationStore ||
        !resolvedIsFunction(
          this.applicationStore.setState
        )
      ) {
        return;
      }

      const snapshot =
        this.getQueueSummary();

      this.applicationStore.setState(
        {
          uploads: {
            queueInitialized:
              true,

            queueVersion:
              UPLOAD_QUEUE_VERSION,

            totalItems:
              snapshot.size,

            activeItems:
              snapshot.activeCount,

            pendingItems:
              snapshot.pendingCount,

            completedItems:
              snapshot.completedCount,

            failedItems:
              snapshot.failedCount,

            totalBytes:
              snapshot.totalBytes,

            uploadedBytes:
              snapshot.uploadedBytes,

            overallProgress:
              snapshot.overallProgress,

            lastChangeAt:
              this.lastChangeAt,

            restored:
              this.restored
          }
        },
        {
          reason:
            resolvedSafeString(
              reason,
              "upload-queue-synchronized"
            )
        }
      );
    }

    schedulePersist() {
      if (
        this.persistTimer
      ) {
        windowObject.clearTimeout(
          this.persistTimer
        );
      }

      this.persistTimer =
        windowObject.setTimeout(
          () => {
            this.persistTimer =
              null;

            this.persist();
          },
          this.persistDebounceMilliseconds
        );
    }

    persist() {
      const persistedItems =
        this.getSerializableItems({
          includeRemoved:
            false
        }).filter(
          item =>
            item.status !==
            UPLOAD_STATUS.COMPLETED ||
            item.remoteMediaId ||
            item.remoteUrl
        );

      const payload = {
        version:
          UPLOAD_QUEUE_VERSION,

        savedAt:
          nowIsoString(),

        classId:
          resolveClassId(),

        items:
          persistedItems
      };

      try {
        windowObject.localStorage
          .setItem(
            this.storageKey,
            JSON.stringify(
              payload
            )
          );

        this.lastPersistedAt =
          payload.savedAt;

        return true;
      } catch (
        persistenceError
      ) {
        const normalizedError =
          resolvedNormalizeError(
            persistenceError,
            "The upload queue could not be saved in this browser."
          );

        this.emit(
          UPLOAD_EVENTS.PERSISTENCE_FAILED,
          {
            error:
              normalizedError
          }
        );

        console.warn(
          "[AIFT Media Library] Upload queue persistence failed:",
          persistenceError
        );

        return false;
      }
    }

    restore() {
      this.assertAvailable();

      let rawValue =
        null;

      try {
        rawValue =
          windowObject.localStorage
            .getItem(
              this.storageKey
            );
      } catch (
        readError
      ) {
        console.warn(
          "[AIFT Media Library] Upload queue storage could not be read:",
          readError
        );

        return {
          restored:
            0,

          skipped:
            0
        };
      }

      if (
        !rawValue
      ) {
        this.restored =
          true;

        this.synchronizeApplicationState(
          "upload-queue-empty-restore"
        );

        return {
          restored:
            0,

          skipped:
            0
        };
      }

      let parsedValue;

      try {
        parsedValue =
          JSON.parse(
            rawValue
          );
      } catch (
        parseError
      ) {
        console.warn(
          "[AIFT Media Library] Saved upload queue data is invalid and will be removed:",
          parseError
        );

        try {
          windowObject.localStorage
            .removeItem(
              this.storageKey
            );
        } catch (
          storageRemovalError
        ) {
          void storageRemovalError;
        }

        this.restored =
          true;

        return {
          restored:
            0,

          skipped:
            0
        };
      }

      const restoredClassId =
        resolvedSafeString(
          parsedValue?.classId
        );

      const currentClassId =
        resolveClassId();

      const savedItems =
        resolvedNormalizeArray(
          parsedValue?.items
        );

      let restoredCount =
        0;

      let skippedCount =
        0;

      for (
        const savedItem
        of savedItems
      ) {
        if (
          !resolvedIsObject(
            savedItem
          )
        ) {
          skippedCount +=
            1;

          continue;
        }

        if (
          restoredClassId &&
          currentClassId &&
          restoredClassId !==
            currentClassId
        ) {
          skippedCount +=
            1;

          continue;
        }

        try {
          const restoredItem =
            UploadQueueItem.restore({
              ...savedItem,

              classId:
                savedItem.classId ||
                currentClassId,

              fileAvailable:
                false,

              status:
                savedItem.status ===
                UPLOAD_STATUS.COMPLETED
                  ? UPLOAD_STATUS.COMPLETED
                  : UPLOAD_STATUS.PAUSED,

              warning:
                savedItem.status ===
                UPLOAD_STATUS.COMPLETED
                  ? savedItem.warning
                  : {
                      name:
                        "UploadRestoreWarning",

                      message:
                        "Select the original file again to resume this upload.",

                      code:
                        UPLOAD_ERROR_CODE.FILE_UNAVAILABLE
                    }
            });

          if (
            this.items.has(
              restoredItem.id
            )
          ) {
            skippedCount +=
              1;

            continue;
          }

          this.items.set(
            restoredItem.id,
            restoredItem
          );

          this.order.push(
            restoredItem.id
          );

          restoredCount +=
            1;
        } catch (
          restoreItemError
        ) {
          skippedCount +=
            1;

          console.warn(
            "[AIFT Media Library] An upload queue item could not be restored:",
            restoreItemError
          );
        }
      }

      this.restored =
        true;

      this.lastPersistedAt =
        parsedValue.savedAt
          ? normalizeTimestamp(
              parsedValue.savedAt
            )
          : null;

      this.synchronizeApplicationState(
        "upload-queue-restored"
      );

      this.notifySubscribers(
        "upload-queue-restored"
      );

      this.emit(
        UPLOAD_EVENTS.QUEUE_RESTORED,
        {
          restoredCount,

          skippedCount
        }
      );

      return {
        restored:
          restoredCount,

        skipped:
          skippedCount
      };
    }

    removePersistedQueue() {
      try {
        windowObject.localStorage
          .removeItem(
            this.storageKey
          );

        this.lastPersistedAt =
          null;

        return true;
      } catch (
        removalError
      ) {
        console.warn(
          "[AIFT Media Library] Saved upload queue could not be removed:",
          removalError
        );

        return false;
      }
    }

    destroy() {
      if (
        this.destroyed
      ) {
        return;
      }

      if (
        this.persistTimer
      ) {
        windowObject.clearTimeout(
          this.persistTimer
        );

        this.persistTimer =
          null;
      }

      this.persist();

      for (
        const item
        of this.items.values()
      ) {
        if (
          item.file
        ) {
          this.fingerprintService
            .clear(
              item.file
            );
        }

        item.file =
          null;
      }

      this.subscribers.clear();

      this.items.clear();

      this.order =
        [];

      this.destroyed =
        true;
    }
  }

  /* =========================================================
     QUEUE CONFIGURATION
  ========================================================= */

  function resolveUploadQueueConfiguration() {
    const rootConfiguration =
      mediaLibrary.configuration ||
      application.configuration ||
      {};

    const uploadConfiguration =
      resolvedIsObject(
        rootConfiguration.upload
      )
        ? rootConfiguration.upload
        : {};

    const queueConfiguration =
      resolvedIsObject(
        uploadConfiguration.queue
      )
        ? uploadConfiguration.queue
        : {};

    return {
      storageKey:
        resolvedSafeString(
          queueConfiguration.storageKey,
          UPLOAD_STORAGE_KEY
        ),

      maximumQueueItems:
        Math.max(
          1,
          resolvedSafeInteger(
            queueConfiguration.maximumQueueItems,
            DEFAULT_MAXIMUM_QUEUE_ITEMS
          )
        ),

      maximumFileSizeBytes:
        Math.max(
          DEFAULT_MINIMUM_FILE_SIZE_BYTES,
          resolvedSafeInteger(
            queueConfiguration.maximumFileSizeBytes,
            uploadConfiguration.maximumFileSizeBytes ||
            DEFAULT_MAXIMUM_FILE_SIZE_BYTES
          )
        ),

      minimumFileSizeBytes:
        Math.max(
          0,
          resolvedSafeInteger(
            queueConfiguration.minimumFileSizeBytes,
            DEFAULT_MINIMUM_FILE_SIZE_BYTES
          )
        ),

      persistDebounceMilliseconds:
        Math.max(
          0,
          resolvedSafeInteger(
            queueConfiguration.persistDebounceMilliseconds,
            DEFAULT_PERSIST_DEBOUNCE_MS
          )
        ),

      fingerprintSampleSizeBytes:
        Math.max(
          16 * 1024,
          resolvedSafeInteger(
            queueConfiguration.fingerprintSampleSizeBytes,
            DEFAULT_FINGERPRINT_SAMPLE_SIZE_BYTES
          )
        ),

      allowedMediaTypes:
        resolvedNormalizeArray(
          queueConfiguration.allowedMediaTypes ||
          uploadConfiguration.allowedMediaTypes
        ),

      allowedMimeTypes:
        resolvedNormalizeArray(
          queueConfiguration.allowedMimeTypes ||
          uploadConfiguration.allowedMimeTypes
        ),

      blockedExtensions:
        resolvedNormalizeArray(
          queueConfiguration.blockedExtensions ||
          uploadConfiguration.blockedExtensions
        ),

      autoRestore:
        queueConfiguration.autoRestore !==
        false
    };
  }

  /* =========================================================
     QUEUE INSTANCE
  ========================================================= */

  const uploadQueueConfiguration =
    resolveUploadQueueConfiguration();

  const uploadFingerprintService =
    new UploadFingerprintService({
      sampleSizeBytes:
        uploadQueueConfiguration
          .fingerprintSampleSizeBytes
    });

  const uploadQueue =
    new UploadQueueStore({
      eventBus,

      applicationStore:
        store,

      notifications,

      fingerprintService:
        uploadFingerprintService,

      storageKey:
        uploadQueueConfiguration
          .storageKey,

      maximumQueueItems:
        uploadQueueConfiguration
          .maximumQueueItems,

      maximumFileSizeBytes:
        uploadQueueConfiguration
          .maximumFileSizeBytes,

      minimumFileSizeBytes:
        uploadQueueConfiguration
          .minimumFileSizeBytes,

      persistDebounceMilliseconds:
        uploadQueueConfiguration
          .persistDebounceMilliseconds,

      allowedMediaTypes:
        uploadQueueConfiguration
          .allowedMediaTypes,

      allowedMimeTypes:
        uploadQueueConfiguration
          .allowedMimeTypes,

      blockedExtensions:
        uploadQueueConfiguration
          .blockedExtensions
    });

  if (
    uploadQueueConfiguration
      .autoRestore
  ) {
    uploadQueue.restore();
  }

  /* =========================================================
     APPLICATION CLEANUP INTEGRATION
  ========================================================= */

  if (
    application &&
    resolvedIsFunction(
      application.registerCleanup
    )
  ) {
    application.registerCleanup(
      () => {
        uploadQueue.destroy();
      }
    );
  }

  /* =========================================================
     PUBLIC UPLOAD INTERFACE
  ========================================================= */

  const uploadPublicInterface = {
    version:
      UPLOAD_QUEUE_VERSION,

    statuses:
      UPLOAD_STATUS,

    priorities:
      UPLOAD_PRIORITY,

    sources:
      UPLOAD_SOURCE,

    errors:
      UPLOAD_ERROR_CODE,

    events:
      UPLOAD_EVENTS,

    queue:
      uploadQueue,

    fingerprintService:
      uploadFingerprintService,

    configuration:
      uploadQueueConfiguration,

    classes: {
      UploadQueueItem,

      UploadQueueStore,

      UploadFingerprintService
    },

    add(
      file,
      options
    ) {
      return uploadQueue.add(
        file,
        options
      );
    },

    addMany(
      files,
      options
    ) {
      return uploadQueue.addMany(
        files,
        options
      );
    },

    get(
      itemId
    ) {
      return uploadQueue.get(
        itemId
      );
    },

    getItems(
      options
    ) {
      return uploadQueue.getItems(
        options
      );
    },

    getSnapshot() {
      return uploadQueue
        .getSnapshot();
    },

    subscribe(
      callback
    ) {
      return uploadQueue.subscribe(
        callback
      );
    },

    update(
      itemId,
      updates,
      options
    ) {
      return uploadQueue.update(
        itemId,
        updates,
        options
      );
    },

    setStatus(
      itemId,
      status,
      options
    ) {
      return uploadQueue.setStatus(
        itemId,
        status,
        options
      );
    },

    setProgress(
      itemId,
      progress,
      options
    ) {
      return uploadQueue.setProgress(
        itemId,
        progress,
        options
      );
    },

    pause(
      itemId,
      options
    ) {
      return uploadQueue.pause(
        itemId,
        options
      );
    },

    resume(
      itemId,
      options
    ) {
      return uploadQueue.resume(
        itemId,
        options
      );
    },

    retry(
      itemId,
      options
    ) {
      return uploadQueue.retry(
        itemId,
        options
      );
    },

    cancel(
      itemId,
      options
    ) {
      return uploadQueue.cancel(
        itemId,
        options
      );
    },

    complete(
      itemId,
      result,
      options
    ) {
      return uploadQueue.complete(
        itemId,
        result,
        options
      );
    },

    fail(
      itemId,
      error,
      options
    ) {
      return uploadQueue.fail(
        itemId,
        error,
        options
      );
    },

    remove(
      itemId,
      options
    ) {
      return uploadQueue.remove(
        itemId,
        options
      );
    },

    clear(
      options
    ) {
      return uploadQueue.clear(
        options
      );
    },

    trimCompleted(
      maximumCompletedItems
    ) {
      return uploadQueue.trimCompleted(
        maximumCompletedItems
      );
    },

    replaceFile(
      itemId,
      file,
      options
    ) {
      return uploadQueue.replaceFile(
        itemId,
        file,
        options
      );
    },

    generateFingerprint(
      itemId,
      options
    ) {
      return uploadQueue
        .generateFingerprint(
          itemId,
          options
        );
    },

    persist() {
      return uploadQueue.persist();
    },

    restore() {
      return uploadQueue.restore();
    },

    destroy() {
      return uploadQueue.destroy();
    }
  };

  /* =========================================================
     CORE INTERFACE EXTENSION
  ========================================================= */

  mediaLibrary.uploads =
    uploadPublicInterface;

  mediaLibrary.uploadQueue =
    uploadQueue;

  mediaLibrary.uploadFingerprintService =
    uploadFingerprintService;

  mediaLibrary.uploadEvents =
    UPLOAD_EVENTS;

  mediaLibrary.uploadStatuses =
    UPLOAD_STATUS;

  mediaLibrary.uploadPriorities =
    UPLOAD_PRIORITY;

  mediaLibrary.uploadSources =
    UPLOAD_SOURCE;

  mediaLibrary.classes = {
    ...mediaLibrary.classes,

    UploadQueueItem,

    UploadQueueStore,

    UploadFingerprintService
  };

  mediaLibrary.addUpload =
    function addUpload(
      file,
      options
    ) {
      return uploadQueue.add(
        file,
        options
      );
    };

  mediaLibrary.addUploads =
    function addUploads(
      files,
      options
    ) {
      return uploadQueue.addMany(
        files,
        options
      );
    };

  mediaLibrary.getUpload =
    function getUpload(
      itemId
    ) {
      return uploadQueue.get(
        itemId
      );
    };

  mediaLibrary.getUploads =
    function getUploads(
      options
    ) {
      return uploadQueue.getItems(
        options
      );
    };

  mediaLibrary.getUploadQueueSnapshot =
    function getUploadQueueSnapshot() {
      return uploadQueue
        .getSnapshot();
    };

  mediaLibrary.subscribeToUploads =
    function subscribeToUploads(
      callback
    ) {
      return uploadQueue.subscribe(
        callback
      );
    };

  mediaLibrary.pauseUpload =
    function pauseUpload(
      itemId,
      options
    ) {
      return uploadQueue.pause(
        itemId,
        options
      );
    };

  mediaLibrary.resumeUpload =
    function resumeUpload(
      itemId,
      options
    ) {
      return uploadQueue.resume(
        itemId,
        options
      );
    };

  mediaLibrary.retryUpload =
    function retryUpload(
      itemId,
      options
    ) {
      return uploadQueue.retry(
        itemId,
        options
      );
    };

  mediaLibrary.cancelUpload =
    function cancelUpload(
      itemId,
      options
    ) {
      return uploadQueue.cancel(
        itemId,
        options
      );
    };

  mediaLibrary.removeUpload =
    function removeUpload(
      itemId,
      options
    ) {
      return uploadQueue.remove(
        itemId,
        options
      );
    };

  mediaLibrary.clearUploads =
    function clearUploads(
      options
    ) {
      return uploadQueue.clear(
        options
      );
    };

  mediaLibrary.__uploadQueueInitialized =
    true;

  /* =========================================================
     FOUNDATION READY EVENT
  ========================================================= */

  eventBus.emit(
    UPLOAD_EVENTS.FOUNDATION_INITIALIZED,
    {
      version:
        UPLOAD_QUEUE_VERSION,

      configuration:
        resolvedDeepClone(
          uploadQueueConfiguration
        ),

      queue:
        uploadQueue
          .getQueueSummary(),

      timestamp:
        nowIsoString()
    }
  );
})(
  window,
  document
);
"use strict";

/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2B OF 15
   CHUNKED UPLOAD ENGINE
========================================================= */

(function initializeAiftChunkedUploadEngine(
  windowObject,
  documentObject
) {
  if (
    !windowObject ||
    !documentObject
  ) {
    return;
  }

  const mediaLibrary =
    windowObject.AIFTMediaLibrary;

  if (
    !mediaLibrary ||
    !mediaLibrary.__coreInitialized
  ) {
    console.error(
      "[AIFT Media Library] Part 2B requires Part 1 to be loaded first."
    );

    return;
  }

  if (
    !mediaLibrary.__uploadQueueInitialized ||
    !mediaLibrary.uploads
  ) {
    console.error(
      "[AIFT Media Library] Part 2B requires Part 2A to be loaded first."
    );

    return;
  }

  if (
    mediaLibrary.__chunkedUploadInitialized
  ) {
    console.warn(
      "[AIFT Media Library] Chunked upload engine has already been initialized."
    );

    return;
  }

  /* =========================================================
     CORE REFERENCES
  ========================================================= */

  const application =
    mediaLibrary.application;

  const api =
    mediaLibrary.api;

  const store =
    mediaLibrary.store;

  const eventBus =
    mediaLibrary.eventBus;

  const notifications =
    mediaLibrary.notifications;

  const uploads =
    mediaLibrary.uploads;

  const uploadQueue =
    uploads.queue;

  const uploadStatuses =
    uploads.statuses;

  const uploadEvents =
    uploads.events;

  const utilities =
    mediaLibrary.utilities ||
    {};

  const {
    isObject,
    isFunction,
    safeString,
    safeNumber,
    safeInteger,
    clampNumber,
    normalizeArray,
    createId,
    delay,
    normalizeError,
    deepClone
  } = utilities;

  /* =========================================================
     CHUNKED UPLOAD CONSTANTS
  ========================================================= */

  const CHUNKED_UPLOAD_VERSION =
    "1.0.0";

  const DEFAULT_CHUNK_SIZE_BYTES =
    8 * 1024 * 1024;

  const MINIMUM_CHUNK_SIZE_BYTES =
    256 * 1024;

  const MAXIMUM_CHUNK_SIZE_BYTES =
    64 * 1024 * 1024;

  const DEFAULT_CHUNK_UPLOAD_TIMEOUT_MS =
    120000;

  const DEFAULT_UPLOAD_INITIALIZATION_TIMEOUT_MS =
    30000;

  const DEFAULT_UPLOAD_FINALIZATION_TIMEOUT_MS =
    120000;

  const DEFAULT_MAXIMUM_CHUNK_ATTEMPTS =
    5;

  const DEFAULT_RETRY_BASE_DELAY_MS =
    1000;

  const DEFAULT_RETRY_MAX_DELAY_MS =
    30000;

  const DEFAULT_RETRY_JITTER_RATIO =
    0.25;

  const DEFAULT_MAXIMUM_PARALLEL_CHUNKS =
    3;

  const DEFAULT_PROGRESS_THROTTLE_MS =
    100;

  const DEFAULT_SESSION_PERSIST_DEBOUNCE_MS =
    250;

  const DEFAULT_STALE_SESSION_AGE_MS =
    7 * 24 * 60 * 60 * 1000;

  const CHUNK_SESSION_STORAGE_KEY =
    "aift.mediaLibrary.chunkSessions";

  const CHUNK_UPLOAD_STATE =
    Object.freeze({
      IDLE:
        "idle",

      INITIALIZING:
        "initializing",

      READY:
        "ready",

      UPLOADING:
        "uploading",

      PAUSING:
        "pausing",

      PAUSED:
        "paused",

      FINALIZING:
        "finalizing",

      COMPLETED:
        "completed",

      FAILED:
        "failed",

      CANCELED:
        "canceled",

      DESTROYED:
        "destroyed"
    });

  const CHUNK_STATUS =
    Object.freeze({
      PENDING:
        "pending",

      QUEUED:
        "queued",

      UPLOADING:
        "uploading",

      COMPLETED:
        "completed",

      FAILED:
        "failed",

      CANCELED:
        "canceled"
    });

  const CHUNKED_UPLOAD_ERROR_CODE =
    Object.freeze({
      INVALID_FILE:
        "CHUNK_UPLOAD_INVALID_FILE",

      FILE_UNAVAILABLE:
        "CHUNK_UPLOAD_FILE_UNAVAILABLE",

      SESSION_INITIALIZATION_FAILED:
        "CHUNK_UPLOAD_SESSION_INITIALIZATION_FAILED",

      SESSION_INVALID:
        "CHUNK_UPLOAD_SESSION_INVALID",

      CHUNK_FAILED:
        "CHUNK_UPLOAD_CHUNK_FAILED",

      CHUNK_TIMEOUT:
        "CHUNK_UPLOAD_CHUNK_TIMEOUT",

      FINALIZATION_FAILED:
        "CHUNK_UPLOAD_FINALIZATION_FAILED",

      ABORTED:
        "CHUNK_UPLOAD_ABORTED",

      PAUSED:
        "CHUNK_UPLOAD_PAUSED",

      NETWORK_ERROR:
        "CHUNK_UPLOAD_NETWORK_ERROR",

      RESPONSE_INVALID:
        "CHUNK_UPLOAD_RESPONSE_INVALID",

      STORAGE_FAILED:
        "CHUNK_UPLOAD_STORAGE_FAILED",

      UNKNOWN:
        "CHUNK_UPLOAD_UNKNOWN"
    });

  const CHUNKED_UPLOAD_EVENTS =
    Object.freeze({
      ENGINE_INITIALIZED:
        "media-library:chunk-engine-initialized",

      SESSION_CREATED:
        "media-library:chunk-session-created",

      SESSION_RESTORED:
        "media-library:chunk-session-restored",

      SESSION_UPDATED:
        "media-library:chunk-session-updated",

      SESSION_REMOVED:
        "media-library:chunk-session-removed",

      SESSION_INITIALIZING:
        "media-library:chunk-session-initializing",

      SESSION_READY:
        "media-library:chunk-session-ready",

      SESSION_PAUSED:
        "media-library:chunk-session-paused",

      SESSION_RESUMED:
        "media-library:chunk-session-resumed",

      SESSION_CANCELED:
        "media-library:chunk-session-canceled",

      SESSION_FAILED:
        "media-library:chunk-session-failed",

      SESSION_FINALIZING:
        "media-library:chunk-session-finalizing",

      SESSION_COMPLETED:
        "media-library:chunk-session-completed",

      CHUNK_CREATED:
        "media-library:chunk-created",

      CHUNK_QUEUED:
        "media-library:chunk-queued",

      CHUNK_STARTED:
        "media-library:chunk-started",

      CHUNK_PROGRESS:
        "media-library:chunk-progress",

      CHUNK_RETRYING:
        "media-library:chunk-retrying",

      CHUNK_COMPLETED:
        "media-library:chunk-completed",

      CHUNK_FAILED:
        "media-library:chunk-failed",

      ENGINE_PROGRESS:
        "media-library:chunk-engine-progress",

      PERSISTENCE_FAILED:
        "media-library:chunk-session-persistence-failed"
    });

  /* =========================================================
     UTILITY FALLBACKS
  ========================================================= */

  function localIsObject(
    value
  ) {
    return (
      value !== null &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  }

  function localIsFunction(
    value
  ) {
    return typeof value ===
      "function";
  }

  function localSafeString(
    value,
    fallback = ""
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    const normalizedValue =
      String(value).trim();

    return normalizedValue ||
      fallback;
  }

  function localSafeNumber(
    value,
    fallback = 0
  ) {
    const numericValue =
      Number(value);

    return Number.isFinite(
      numericValue
    )
      ? numericValue
      : fallback;
  }

  function localSafeInteger(
    value,
    fallback = 0
  ) {
    const numericValue =
      localSafeNumber(
        value,
        fallback
      );

    return Math.trunc(
      numericValue
    );
  }

  function localClampNumber(
    value,
    minimum,
    maximum
  ) {
    return Math.min(
      maximum,
      Math.max(
        minimum,
        localSafeNumber(
          value,
          minimum
        )
      )
    );
  }

  function localNormalizeArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    return [value];
  }

  function localCreateId(
    prefix =
      "id"
  ) {
    return [
      prefix,
      Date.now()
        .toString(36),
      Math.random()
        .toString(36)
        .slice(
          2,
          12
        )
    ].join("-");
  }

  function localDelay(
    milliseconds
  ) {
    return new Promise(
      resolve => {
        windowObject.setTimeout(
          resolve,
          Math.max(
            0,
            localSafeInteger(
              milliseconds,
              0
            )
          )
        );
      }
    );
  }

  function localNormalizeError(
    error,
    fallbackMessage =
      "An unexpected chunk upload error occurred."
  ) {
    if (
      error instanceof Error
    ) {
      return {
        name:
          error.name ||
          "Error",

        message:
          error.message ||
          fallbackMessage,

        code:
          error.code ||
          CHUNKED_UPLOAD_ERROR_CODE.UNKNOWN,

        stack:
          error.stack ||
          "",

        details:
          error.details ||
          null,

        retryable:
          Boolean(
            error.retryable
          )
      };
    }

    if (
      localIsObject(
        error
      )
    ) {
      return {
        name:
          localSafeString(
            error.name,
            "Error"
          ),

        message:
          localSafeString(
            error.message,
            fallbackMessage
          ),

        code:
          localSafeString(
            error.code,
            CHUNKED_UPLOAD_ERROR_CODE.UNKNOWN
          ),

        stack:
          localSafeString(
            error.stack
          ),

        details:
          error.details ||
          null,

        retryable:
          Boolean(
            error.retryable
          )
      };
    }

    return {
      name:
        "Error",

      message:
        localSafeString(
          error,
          fallbackMessage
        ),

      code:
        CHUNKED_UPLOAD_ERROR_CODE.UNKNOWN,

      stack:
        "",

      details:
        null,

      retryable:
        false
    };
  }

  function localDeepClone(
    value
  ) {
    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (
        cloneError
      ) {
        void cloneError;
      }
    }

    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  }

  const resolvedIsObject =
    isObject ||
    localIsObject;

  const resolvedIsFunction =
    isFunction ||
    localIsFunction;

  const resolvedSafeString =
    safeString ||
    localSafeString;

  const resolvedSafeNumber =
    safeNumber ||
    localSafeNumber;

  const resolvedSafeInteger =
    safeInteger ||
    localSafeInteger;

  const resolvedClampNumber =
    clampNumber ||
    localClampNumber;

  const resolvedNormalizeArray =
    normalizeArray ||
    localNormalizeArray;

  const resolvedCreateId =
    createId ||
    localCreateId;

  const resolvedDelay =
    delay ||
    localDelay;

  const resolvedNormalizeError =
    normalizeError ||
    localNormalizeError;

  const resolvedDeepClone =
    deepClone ||
    localDeepClone;

  /* =========================================================
     GENERAL HELPERS
  ========================================================= */

  function nowIsoString() {
    return new Date()
      .toISOString();
  }

  function normalizeTimestamp(
    value,
    fallback =
      nowIsoString()
  ) {
    const normalizedValue =
      resolvedSafeString(
        value
      );

    if (
      !normalizedValue
    ) {
      return fallback;
    }

    const parsedTimestamp =
      Date.parse(
        normalizedValue
      );

    if (
      Number.isNaN(
        parsedTimestamp
      )
    ) {
      return fallback;
    }

    return new Date(
      parsedTimestamp
    ).toISOString();
  }

  function normalizeByteCount(
    value
  ) {
    return Math.max(
      0,
      resolvedSafeInteger(
        value,
        0
      )
    );
  }

  function normalizeChunkSize(
    value
  ) {
    return resolvedClampNumber(
      normalizeByteCount(
        value ||
        DEFAULT_CHUNK_SIZE_BYTES
      ),
      MINIMUM_CHUNK_SIZE_BYTES,
      MAXIMUM_CHUNK_SIZE_BYTES
    );
  }

  function normalizeChunkStatus(
    value,
    fallback =
      CHUNK_STATUS.PENDING
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        fallback
      ).toLowerCase();

    if (
      Object.values(
        CHUNK_STATUS
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return fallback;
  }

  function normalizeSessionState(
    value,
    fallback =
      CHUNK_UPLOAD_STATE.IDLE
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        fallback
      ).toLowerCase();

    if (
      Object.values(
        CHUNK_UPLOAD_STATE
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return fallback;
  }

  function createChunkUploadError(
    message,
    options = {}
  ) {
    const uploadError =
      new Error(
        resolvedSafeString(
          message,
          "A chunk upload error occurred."
        )
      );

    uploadError.name =
      "ChunkedUploadError";

    uploadError.code =
      resolvedSafeString(
        options.code,
        CHUNKED_UPLOAD_ERROR_CODE.UNKNOWN
      );

    uploadError.details =
      options.details ||
      null;

    uploadError.retryable =
      Boolean(
        options.retryable
      );

    uploadError.status =
      options.status ||
      null;

    uploadError.cause =
      options.cause ||
      null;

    return uploadError;
  }

  function isAbortError(
    error
  ) {
    return (
      error?.name ===
        "AbortError" ||
      error?.code ===
        CHUNKED_UPLOAD_ERROR_CODE.ABORTED ||
      error?.code ===
        "REQUEST_ABORTED"
    );
  }

  function isRetryableStatus(
    status
  ) {
    const normalizedStatus =
      resolvedSafeInteger(
        status,
        0
      );

    return (
      normalizedStatus ===
        408 ||
      normalizedStatus ===
        409 ||
      normalizedStatus ===
        425 ||
      normalizedStatus ===
        429 ||
      normalizedStatus >=
        500
    );
  }

  function isRetryableError(
    error
  ) {
    if (
      error?.retryable ===
      true
    ) {
      return true;
    }

    if (
      isAbortError(
        error
      )
    ) {
      return false;
    }

    if (
      isRetryableStatus(
        error?.status
      )
    ) {
      return true;
    }

    const errorCode =
      resolvedSafeString(
        error?.code
      );

    return [
      CHUNKED_UPLOAD_ERROR_CODE.CHUNK_TIMEOUT,
      CHUNKED_UPLOAD_ERROR_CODE.NETWORK_ERROR,
      CHUNKED_UPLOAD_ERROR_CODE.CHUNK_FAILED
    ].includes(
      errorCode
    );
  }

  function calculateRetryDelay(
    attempt,
    options = {}
  ) {
    const normalizedAttempt =
      Math.max(
        1,
        resolvedSafeInteger(
          attempt,
          1
        )
      );

    const baseDelay =
      Math.max(
        100,
        resolvedSafeInteger(
          options.baseDelayMilliseconds,
          DEFAULT_RETRY_BASE_DELAY_MS
        )
      );

    const maximumDelay =
      Math.max(
        baseDelay,
        resolvedSafeInteger(
          options.maximumDelayMilliseconds,
          DEFAULT_RETRY_MAX_DELAY_MS
        )
      );

    const jitterRatio =
      resolvedClampNumber(
        resolvedSafeNumber(
          options.jitterRatio,
          DEFAULT_RETRY_JITTER_RATIO
        ),
        0,
        1
      );

    const exponentialDelay =
      Math.min(
        maximumDelay,
        baseDelay *
        Math.pow(
          2,
          normalizedAttempt -
          1
        )
      );

    const jitterRange =
      exponentialDelay *
      jitterRatio;

    const jitter =
      (
        Math.random() *
        jitterRange *
        2
      ) -
      jitterRange;

    return Math.max(
      0,
      Math.round(
        exponentialDelay +
        jitter
      )
    );
  }

  function calculateChunkCount(
    fileSize,
    chunkSize
  ) {
    const normalizedFileSize =
      normalizeByteCount(
        fileSize
      );

    const normalizedChunkSize =
      normalizeChunkSize(
        chunkSize
      );

    if (
      normalizedFileSize <=
      0
    ) {
      return 0;
    }

    return Math.ceil(
      normalizedFileSize /
      normalizedChunkSize
    );
  }

  function calculateChunkBounds(
    chunkIndex,
    chunkSize,
    fileSize
  ) {
    const normalizedIndex =
      Math.max(
        0,
        resolvedSafeInteger(
          chunkIndex,
          0
        )
      );

    const normalizedChunkSize =
      normalizeChunkSize(
        chunkSize
      );

    const normalizedFileSize =
      normalizeByteCount(
        fileSize
      );

    const start =
      normalizedIndex *
      normalizedChunkSize;

    const end =
      Math.min(
        normalizedFileSize,
        start +
        normalizedChunkSize
      );

    return {
      start,
      end,
      size:
        Math.max(
          0,
          end -
          start
        )
    };
  }

  function resolveEndpoint(
    endpointName,
    fallback
  ) {
    const configuredEndpoints =
      mediaLibrary
        .configuration
        ?.endpoints ||
      application
        .configuration
        ?.endpoints ||
      {};

    return resolvedSafeString(
      configuredEndpoints[
        endpointName
      ],
      fallback
    );
  }

  function resolveUploadQueueItem(
    itemOrId
  ) {
    if (
      resolvedIsObject(
        itemOrId
      ) &&
      itemOrId.id
    ) {
      return itemOrId;
    }

    return uploadQueue.get(
      resolvedSafeString(
        itemOrId
      )
    );
  }

  function resolveAuthenticationToken() {
    const authenticationManager =
      mediaLibrary.authentication ||
      application
        ?.authenticationManager;

    if (
      authenticationManager &&
      resolvedIsFunction(
        authenticationManager.getToken
      )
    ) {
      return resolvedSafeString(
        authenticationManager
          .getToken()
      );
    }

    if (
      authenticationManager &&
      resolvedIsFunction(
        authenticationManager.resolveToken
      )
    ) {
      return resolvedSafeString(
        authenticationManager
          .resolveToken()
      );
    }

    return "";
  }

  function buildAbsoluteApiUrl(
    path
  ) {
    const normalizedPath =
      resolvedSafeString(
        path
      );

    if (
      /^https?:\/\//i.test(
        normalizedPath
      )
    ) {
      return normalizedPath;
    }

    const apiBaseUrl =
      resolvedSafeString(
        mediaLibrary
          .configuration
          ?.apiBaseUrl ||
        application
          .configuration
          ?.apiBaseUrl
      ).replace(
        /\/+$/,
        ""
      );

    return [
      apiBaseUrl,
      normalizedPath.startsWith(
        "/"
      )
        ? normalizedPath
        : `/${normalizedPath}`
    ].join("");
  }

  function normalizeServerResponse(
    response
  ) {
    if (
      response === null ||
      response === undefined
    ) {
      return {};
    }

    if (
      resolvedIsObject(
        response.data
      )
    ) {
      return response.data;
    }

    if (
      resolvedIsObject(
        response.result
      )
    ) {
      return response.result;
    }

    if (
      resolvedIsObject(
        response
      )
    ) {
      return response;
    }

    return {};
  }

  /* =========================================================
     CHUNK DESCRIPTOR
  ========================================================= */

  class UploadChunkDescriptor {
    constructor(
      options = {}
    ) {
      this.id =
        resolvedSafeString(
          options.id,
          resolvedCreateId(
            "media-chunk"
          )
        );

      this.sessionId =
        resolvedSafeString(
          options.sessionId
        );

      this.queueItemId =
        resolvedSafeString(
          options.queueItemId
        );

      this.index =
        Math.max(
          0,
          resolvedSafeInteger(
            options.index,
            0
          )
        );

      this.number =
        this.index +
        1;

      this.start =
        normalizeByteCount(
          options.start
        );

      this.end =
        normalizeByteCount(
          options.end
        );

      this.size =
        Math.max(
          0,
          normalizeByteCount(
            options.size ||
            (
              this.end -
              this.start
            )
          )
        );

      this.status =
        normalizeChunkStatus(
          options.status
        );

      this.attempt =
        Math.max(
          0,
          resolvedSafeInteger(
            options.attempt,
            0
          )
        );

      this.maximumAttempts =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumAttempts,
            DEFAULT_MAXIMUM_CHUNK_ATTEMPTS
          )
        );

      this.uploadedBytes =
        Math.min(
          this.size,
          normalizeByteCount(
            options.uploadedBytes
          )
        );

      this.etag =
        resolvedSafeString(
          options.etag
        );

      this.checksum =
        resolvedSafeString(
          options.checksum
        );

      this.remotePartId =
        resolvedSafeString(
          options.remotePartId ||
          options.partId
        );

      this.error =
        options.error
          ? resolvedNormalizeError(
              options.error
            )
          : null;

      this.createdAt =
        normalizeTimestamp(
          options.createdAt
        );

      this.updatedAt =
        normalizeTimestamp(
          options.updatedAt,
          this.createdAt
        );

      this.startedAt =
        options.startedAt
          ? normalizeTimestamp(
              options.startedAt
            )
          : null;

      this.completedAt =
        options.completedAt
          ? normalizeTimestamp(
              options.completedAt
            )
          : null;

      this.failedAt =
        options.failedAt
          ? normalizeTimestamp(
              options.failedAt
            )
          : null;

      this.controller =
        null;

      this.request =
        null;
    }

    get progress() {
      if (
        this.size <=
        0
      ) {
        return 0;
      }

      return resolvedClampNumber(
        (
          this.uploadedBytes /
          this.size
        ) *
        100,
        0,
        100
      );
    }

    get remainingBytes() {
      return Math.max(
        0,
        this.size -
        this.uploadedBytes
      );
    }

    isComplete() {
      return this.status ===
        CHUNK_STATUS.COMPLETED;
    }

    isActive() {
      return this.status ===
        CHUNK_STATUS.UPLOADING;
    }

    canRetry() {
      return (
        this.status ===
          CHUNK_STATUS.FAILED &&
        this.attempt <
          this.maximumAttempts
      );
    }

    markQueued() {
      this.status =
        CHUNK_STATUS.QUEUED;

      this.error =
        null;

      this.updatedAt =
        nowIsoString();

      return this;
    }

    markStarted() {
      this.status =
        CHUNK_STATUS.UPLOADING;

      this.attempt +=
        1;

      this.startedAt =
        nowIsoString();

      this.updatedAt =
        this.startedAt;

      this.error =
        null;

      return this;
    }

    setProgress(
      uploadedBytes
    ) {
      this.uploadedBytes =
        Math.min(
          this.size,
          normalizeByteCount(
            uploadedBytes
          )
        );

      this.updatedAt =
        nowIsoString();

      return this;
    }

    markCompleted(
      result = {}
    ) {
      this.status =
        CHUNK_STATUS.COMPLETED;

      this.uploadedBytes =
        this.size;

      this.etag =
        resolvedSafeString(
          result.etag ||
          result.ETag,
          this.etag
        );

      this.checksum =
        resolvedSafeString(
          result.checksum,
          this.checksum
        );

      this.remotePartId =
        resolvedSafeString(
          result.partId ||
          result.remotePartId ||
          result.id,
          this.remotePartId
        );

      this.completedAt =
        nowIsoString();

      this.updatedAt =
        this.completedAt;

      this.error =
        null;

      return this;
    }

    markFailed(
      error
    ) {
      this.status =
        CHUNK_STATUS.FAILED;

      this.error =
        resolvedNormalizeError(
          error
        );

      this.failedAt =
        nowIsoString();

      this.updatedAt =
        this.failedAt;

      return this;
    }

    markCanceled() {
      this.status =
        CHUNK_STATUS.CANCELED;

      this.updatedAt =
        nowIsoString();

      return this;
    }

    reset() {
      this.status =
        CHUNK_STATUS.PENDING;

      this.uploadedBytes =
        0;

      this.error =
        null;

      this.startedAt =
        null;

      this.completedAt =
        null;

      this.failedAt =
        null;

      this.controller =
        null;

      this.request =
        null;

      this.updatedAt =
        nowIsoString();

      return this;
    }

    toJSON() {
      return {
        id:
          this.id,

        sessionId:
          this.sessionId,

        queueItemId:
          this.queueItemId,

        index:
          this.index,

        number:
          this.number,

        start:
          this.start,

        end:
          this.end,

        size:
          this.size,

        status:
          this.status,

        attempt:
          this.attempt,

        maximumAttempts:
          this.maximumAttempts,

        uploadedBytes:
          this.uploadedBytes,

        progress:
          this.progress,

        etag:
          this.etag,

        checksum:
          this.checksum,

        remotePartId:
          this.remotePartId,

        error:
          this.error
            ? resolvedDeepClone(
                this.error
              )
            : null,

        createdAt:
          this.createdAt,

        updatedAt:
          this.updatedAt,

        startedAt:
          this.startedAt,

        completedAt:
          this.completedAt,

        failedAt:
          this.failedAt
      };
    }

    static restore(
      data
    ) {
      return new UploadChunkDescriptor(
        data
      );
    }
  }

  /* =========================================================
     CHUNKED UPLOAD SESSION
  ========================================================= */

  class ChunkedUploadSession {
    constructor(
      queueItem,
      options = {}
    ) {
      if (
        !queueItem
      ) {
        throw createChunkUploadError(
          "A valid upload queue item is required.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.INVALID_FILE
          }
        );
      }

      this.id =
        resolvedSafeString(
          options.id,
          resolvedCreateId(
            "chunk-session"
          )
        );

      this.queueItemId =
        resolvedSafeString(
          queueItem.id
        );

      this.classId =
        resolvedSafeString(
          options.classId ||
          queueItem.classId
        );

      this.fileName =
        resolvedSafeString(
          options.fileName ||
          queueItem.name,
          "untitled"
        );

      this.mimeType =
        resolvedSafeString(
          options.mimeType ||
          queueItem.mimeType,
          "application/octet-stream"
        );

      this.fileSize =
        normalizeByteCount(
          options.fileSize ||
          queueItem.size
        );

      this.fileFingerprint =
        resolvedSafeString(
          options.fileFingerprint ||
          queueItem.fingerprint ||
          queueItem.basicFingerprint
        );

      this.chunkSize =
        normalizeChunkSize(
          options.chunkSize
        );

      this.totalChunks =
        calculateChunkCount(
          this.fileSize,
          this.chunkSize
        );

      this.maximumParallelChunks =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumParallelChunks,
            DEFAULT_MAXIMUM_PARALLEL_CHUNKS
          )
        );

      this.maximumChunkAttempts =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumChunkAttempts,
            DEFAULT_MAXIMUM_CHUNK_ATTEMPTS
          )
        );

      this.state =
        normalizeSessionState(
          options.state,
          CHUNK_UPLOAD_STATE.IDLE
        );

      this.remoteUploadId =
        resolvedSafeString(
          options.remoteUploadId ||
          options.uploadId
        );

      this.remoteMediaId =
        resolvedSafeString(
          options.remoteMediaId ||
          options.mediaId
        );

      this.uploadUrl =
        resolvedSafeString(
          options.uploadUrl
        );

      this.finalizeUrl =
        resolvedSafeString(
          options.finalizeUrl
        );

      this.cancelUrl =
        resolvedSafeString(
          options.cancelUrl
        );

      this.uploadHeaders =
        resolvedIsObject(
          options.uploadHeaders
        )
          ? resolvedDeepClone(
              options.uploadHeaders
            )
          : {};

      this.serverMetadata =
        resolvedIsObject(
          options.serverMetadata
        )
          ? resolvedDeepClone(
              options.serverMetadata
            )
          : {};

      this.createdAt =
        normalizeTimestamp(
          options.createdAt
        );

      this.updatedAt =
        normalizeTimestamp(
          options.updatedAt,
          this.createdAt
        );

      this.startedAt =
        options.startedAt
          ? normalizeTimestamp(
              options.startedAt
            )
          : null;

      this.pausedAt =
        options.pausedAt
          ? normalizeTimestamp(
              options.pausedAt
            )
          : null;

      this.completedAt =
        options.completedAt
          ? normalizeTimestamp(
              options.completedAt
            )
          : null;

      this.failedAt =
        options.failedAt
          ? normalizeTimestamp(
              options.failedAt
            )
          : null;

      this.canceledAt =
        options.canceledAt
          ? normalizeTimestamp(
              options.canceledAt
            )
          : null;

      this.lastProgressAt =
        options.lastProgressAt
          ? normalizeTimestamp(
              options.lastProgressAt
            )
          : null;

      this.error =
        options.error
          ? resolvedNormalizeError(
              options.error
            )
          : null;

      this.chunks =
        [];

      this.createChunks(
        options.chunks
      );
    }

    createChunks(
      restoredChunks
    ) {
      const restoredChunkMap =
        new Map(
          resolvedNormalizeArray(
            restoredChunks
          )
            .filter(
              resolvedIsObject
            )
            .map(
              chunk => [
                resolvedSafeInteger(
                  chunk.index,
                  -1
                ),
                chunk
              ]
            )
            .filter(
              entry =>
                entry[0] >=
                0
            )
        );

      this.chunks =
        [];

      for (
        let chunkIndex =
          0;
        chunkIndex <
          this.totalChunks;
        chunkIndex +=
          1
      ) {
        const bounds =
          calculateChunkBounds(
            chunkIndex,
            this.chunkSize,
            this.fileSize
          );

        const restoredChunk =
          restoredChunkMap.get(
            chunkIndex
          );

        const chunk =
          new UploadChunkDescriptor({
            ...restoredChunk,

            sessionId:
              this.id,

            queueItemId:
              this.queueItemId,

            index:
              chunkIndex,

            start:
              bounds.start,

            end:
              bounds.end,

            size:
              bounds.size,

            maximumAttempts:
              this.maximumChunkAttempts
          });

        if (
          chunk.status ===
          CHUNK_STATUS.UPLOADING
        ) {
          chunk.status =
            CHUNK_STATUS.PENDING;

          chunk.uploadedBytes =
            0;
        }

        this.chunks.push(
          chunk
        );
      }

      return this.chunks;
    }

    get completedChunks() {
      return this.chunks
        .filter(
          chunk =>
            chunk.isComplete()
        );
    }

    get failedChunks() {
      return this.chunks
        .filter(
          chunk =>
            chunk.status ===
            CHUNK_STATUS.FAILED
        );
    }

    get pendingChunks() {
      return this.chunks
        .filter(
          chunk =>
            [
              CHUNK_STATUS.PENDING,
              CHUNK_STATUS.QUEUED,
              CHUNK_STATUS.FAILED
            ].includes(
              chunk.status
            )
        );
    }

    get activeChunks() {
      return this.chunks
        .filter(
          chunk =>
            chunk.isActive()
        );
    }

    get uploadedBytes() {
      return this.chunks
        .reduce(
          (
            total,
            chunk
          ) =>
            total +
            chunk.uploadedBytes,
          0
        );
    }

    get completedBytes() {
      return this.chunks
        .filter(
          chunk =>
            chunk.isComplete()
        )
        .reduce(
          (
            total,
            chunk
          ) =>
            total +
            chunk.size,
          0
        );
    }

    get progress() {
      if (
        this.fileSize <=
        0
      ) {
        return 0;
      }

      return resolvedClampNumber(
        (
          this.uploadedBytes /
          this.fileSize
        ) *
        100,
        0,
        100
      );
    }

    get isComplete() {
      return (
        this.totalChunks >
          0 &&
        this.completedChunks
          .length ===
          this.totalChunks
      );
    }

    get hasFailedChunks() {
      return this.failedChunks
        .length >
        0;
    }

    setState(
      state,
      options = {}
    ) {
      this.state =
        normalizeSessionState(
          state,
          this.state
        );

      this.updatedAt =
        nowIsoString();

      if (
        this.state ===
          CHUNK_UPLOAD_STATE.UPLOADING &&
        !this.startedAt
      ) {
        this.startedAt =
          this.updatedAt;
      }

      if (
        this.state ===
        CHUNK_UPLOAD_STATE.PAUSED
      ) {
        this.pausedAt =
          this.updatedAt;
      }

      if (
        this.state ===
        CHUNK_UPLOAD_STATE.COMPLETED
      ) {
        this.completedAt =
          this.updatedAt;

        this.error =
          null;
      }

      if (
        this.state ===
        CHUNK_UPLOAD_STATE.FAILED
      ) {
        this.failedAt =
          this.updatedAt;

        if (
          options.error
        ) {
          this.error =
            resolvedNormalizeError(
              options.error
            );
        }
      }

      if (
        this.state ===
        CHUNK_UPLOAD_STATE.CANCELED
      ) {
        this.canceledAt =
          this.updatedAt;
      }

      return this;
    }

    getNextChunks(
      limit =
        this.maximumParallelChunks
    ) {
      const normalizedLimit =
        Math.max(
          0,
          resolvedSafeInteger(
            limit,
            this.maximumParallelChunks
          )
        );

      return this.chunks
        .filter(
          chunk =>
            (
              chunk.status ===
                CHUNK_STATUS.PENDING ||
              chunk.status ===
                CHUNK_STATUS.QUEUED ||
              (
                chunk.status ===
                  CHUNK_STATUS.FAILED &&
                chunk.canRetry()
              )
            )
        )
        .sort(
          (
            firstChunk,
            secondChunk
          ) =>
            firstChunk.index -
            secondChunk.index
        )
        .slice(
          0,
          normalizedLimit
        );
    }

    resetFailedChunks() {
      for (
        const chunk
        of this.failedChunks
      ) {
        if (
          chunk.canRetry()
        ) {
          chunk.status =
            CHUNK_STATUS.PENDING;

          chunk.error =
            null;

          chunk.uploadedBytes =
            0;

          chunk.updatedAt =
            nowIsoString();
        }
      }

      this.error =
        null;

      this.updatedAt =
        nowIsoString();

      return this;
    }

    toJSON() {
      return {
        id:
          this.id,

        queueItemId:
          this.queueItemId,

        classId:
          this.classId,

        fileName:
          this.fileName,

        mimeType:
          this.mimeType,

        fileSize:
          this.fileSize,

        fileFingerprint:
          this.fileFingerprint,

        chunkSize:
          this.chunkSize,

        totalChunks:
          this.totalChunks,

        maximumParallelChunks:
          this.maximumParallelChunks,

        maximumChunkAttempts:
          this.maximumChunkAttempts,

        state:
          this.state,

        remoteUploadId:
          this.remoteUploadId,

        remoteMediaId:
          this.remoteMediaId,

        uploadUrl:
          this.uploadUrl,

        finalizeUrl:
          this.finalizeUrl,

        cancelUrl:
          this.cancelUrl,

        uploadHeaders:
          resolvedDeepClone(
            this.uploadHeaders
          ),

        serverMetadata:
          resolvedDeepClone(
            this.serverMetadata
          ),

        uploadedBytes:
          this.uploadedBytes,

        completedBytes:
          this.completedBytes,

        progress:
          this.progress,

        completedChunkCount:
          this.completedChunks.length,

        failedChunkCount:
          this.failedChunks.length,

        activeChunkCount:
          this.activeChunks.length,

        createdAt:
          this.createdAt,

        updatedAt:
          this.updatedAt,

        startedAt:
          this.startedAt,

        pausedAt:
          this.pausedAt,

        completedAt:
          this.completedAt,

        failedAt:
          this.failedAt,

        canceledAt:
          this.canceledAt,

        lastProgressAt:
          this.lastProgressAt,

        error:
          this.error
            ? resolvedDeepClone(
                this.error
              )
            : null,

        chunks:
          this.chunks.map(
            chunk =>
              chunk.toJSON()
          )
      };
    }

    static restore(
      queueItem,
      data
    ) {
      return new ChunkedUploadSession(
        queueItem,
        data
      );
    }
  }

  /* =========================================================
     XHR CHUNK TRANSPORT
  ========================================================= */

  class XMLHttpRequestChunkTransport {
    constructor(
      options = {}
    ) {
      this.defaultTimeoutMilliseconds =
        Math.max(
          1000,
          resolvedSafeInteger(
            options.timeoutMilliseconds,
            DEFAULT_CHUNK_UPLOAD_TIMEOUT_MS
          )
        );

      this.withCredentials =
        options.withCredentials ===
        true;
    }

    upload(
      requestOptions = {}
    ) {
      return new Promise(
        (
          resolve,
          reject
        ) => {
          const url =
            resolvedSafeString(
              requestOptions.url
            );

          if (
            !url
          ) {
            reject(
              createChunkUploadError(
                "The chunk upload URL is missing.",
                {
                  code:
                    CHUNKED_UPLOAD_ERROR_CODE.SESSION_INVALID
                }
              )
            );

            return;
          }

          const xhr =
            new XMLHttpRequest();

          const controller =
            requestOptions.controller ||
            new AbortController();

          let settled =
            false;

          const settleOnce =
            callback => {
              if (
                settled
              ) {
                return;
              }

              settled =
                true;

              controller.signal
                .removeEventListener(
                  "abort",
                  handleAbort
                );

              callback();
            };

          const handleAbort =
            () => {
              if (
                xhr.readyState !==
                  XMLHttpRequest.DONE
              ) {
                xhr.abort();
              }

              settleOnce(
                () => {
                  reject(
                    createChunkUploadError(
                      "The chunk upload was aborted.",
                      {
                        code:
                          CHUNKED_UPLOAD_ERROR_CODE.ABORTED
                      }
                    )
                  );
                }
              );
            };

          controller.signal
            .addEventListener(
              "abort",
              handleAbort,
              {
                once:
                  true
              }
            );

          xhr.open(
            resolvedSafeString(
              requestOptions.method,
              "PUT"
            ).toUpperCase(),
            url,
            true
          );

          xhr.timeout =
            Math.max(
              1000,
              resolvedSafeInteger(
                requestOptions.timeoutMilliseconds,
                this.defaultTimeoutMilliseconds
              )
            );

          xhr.withCredentials =
            requestOptions.withCredentials ===
              true ||
            this.withCredentials;

          const headers =
            resolvedIsObject(
              requestOptions.headers
            )
              ? requestOptions.headers
              : {};

          Object.entries(
            headers
          ).forEach(
            (
              [
                headerName,
                headerValue
              ]
            ) => {
              const normalizedHeaderName =
                resolvedSafeString(
                  headerName
                );

              if (
                !normalizedHeaderName ||
                headerValue ===
                  undefined ||
                headerValue ===
                  null
              ) {
                return;
              }

              xhr.setRequestHeader(
                normalizedHeaderName,
                String(
                  headerValue
                )
              );
            }
          );

          if (
            requestOptions.contentType &&
            !Object.keys(
              headers
            ).some(
              headerName =>
                headerName
                  .toLowerCase() ===
                "content-type"
            )
          ) {
            xhr.setRequestHeader(
              "Content-Type",
              requestOptions.contentType
            );
          }

          xhr.upload.onprogress =
            progressEvent => {
              if (
                !progressEvent
                  .lengthComputable
              ) {
                return;
              }

              if (
                resolvedIsFunction(
                  requestOptions.onProgress
                )
              ) {
                requestOptions.onProgress({
                  loaded:
                    progressEvent.loaded,

                  total:
                    progressEvent.total,

                  progress:
                    resolvedClampNumber(
                      (
                        progressEvent.loaded /
                        progressEvent.total
                      ) *
                      100,
                      0,
                      100
                    )
                });
              }
            };

          xhr.onload =
            () => {
              settleOnce(
                () => {
                  const responseText =
                    resolvedSafeString(
                      xhr.responseText
                    );

                  let responseBody =
                    responseText;

                  if (
                    responseText
                  ) {
                    try {
                      responseBody =
                        JSON.parse(
                          responseText
                        );
                    } catch (
                      parseError
                    ) {
                      void parseError;
                    }
                  }

                  if (
                    xhr.status >=
                      200 &&
                    xhr.status <
                      300
                  ) {
                    resolve({
                      status:
                        xhr.status,

                      headers:
                        xhr
                          .getAllResponseHeaders(),

                      body:
                        responseBody,

                      etag:
                        resolvedSafeString(
                          xhr.getResponseHeader(
                            "ETag"
                          )
                        )
                    });

                    return;
                  }

                  reject(
                    createChunkUploadError(
                      resolvedSafeString(
                        responseBody?.message ||
                        responseBody?.error,
                        `Chunk upload failed with status ${xhr.status}.`
                      ),
                      {
                        code:
                          CHUNKED_UPLOAD_ERROR_CODE.CHUNK_FAILED,

                        status:
                          xhr.status,

                        retryable:
                          isRetryableStatus(
                            xhr.status
                          ),

                        details: {
                          response:
                            responseBody
                        }
                      }
                    )
                  );
                }
              );
            };

          xhr.onerror =
            () => {
              settleOnce(
                () => {
                  reject(
                    createChunkUploadError(
                      "A network error interrupted the chunk upload.",
                      {
                        code:
                          CHUNKED_UPLOAD_ERROR_CODE.NETWORK_ERROR,

                        retryable:
                          true
                      }
                    )
                  );
                }
              );
            };

          xhr.ontimeout =
            () => {
              settleOnce(
                () => {
                  reject(
                    createChunkUploadError(
                      "The chunk upload timed out.",
                      {
                        code:
                          CHUNKED_UPLOAD_ERROR_CODE.CHUNK_TIMEOUT,

                        retryable:
                          true
                      }
                    )
                  );
                }
              );
            };

          xhr.onabort =
            () => {
              settleOnce(
                () => {
                  reject(
                    createChunkUploadError(
                      "The chunk upload was aborted.",
                      {
                        code:
                          CHUNKED_UPLOAD_ERROR_CODE.ABORTED
                      }
                    )
                  );
                }
              );
            };

          if (
            resolvedIsFunction(
              requestOptions.onRequestCreated
            )
          ) {
            requestOptions.onRequestCreated(
              xhr,
              controller
            );
          }

          xhr.send(
            requestOptions.body
          );
        }
      );
    }
  }

  /* =========================================================
     CHUNKED UPLOAD ENGINE
  ========================================================= */

  class ChunkedUploadEngine {
    constructor(
      options = {}
    ) {
      this.queue =
        options.queue ||
        uploadQueue;

      this.api =
        options.api ||
        api;

      this.eventBus =
        options.eventBus ||
        eventBus;

      this.notifications =
        options.notifications ||
        notifications;

      this.transport =
        options.transport ||
        new XMLHttpRequestChunkTransport({
          timeoutMilliseconds:
            options.chunkUploadTimeoutMilliseconds
        });

      this.chunkSize =
        normalizeChunkSize(
          options.chunkSize ||
          DEFAULT_CHUNK_SIZE_BYTES
        );

      this.maximumParallelChunks =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumParallelChunks,
            DEFAULT_MAXIMUM_PARALLEL_CHUNKS
          )
        );

      this.maximumChunkAttempts =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumChunkAttempts,
            DEFAULT_MAXIMUM_CHUNK_ATTEMPTS
          )
        );

      this.chunkUploadTimeoutMilliseconds =
        Math.max(
          1000,
          resolvedSafeInteger(
            options.chunkUploadTimeoutMilliseconds,
            DEFAULT_CHUNK_UPLOAD_TIMEOUT_MS
          )
        );

      this.initializationTimeoutMilliseconds =
        Math.max(
          1000,
          resolvedSafeInteger(
            options.initializationTimeoutMilliseconds,
            DEFAULT_UPLOAD_INITIALIZATION_TIMEOUT_MS
          )
        );

      this.finalizationTimeoutMilliseconds =
        Math.max(
          1000,
          resolvedSafeInteger(
            options.finalizationTimeoutMilliseconds,
            DEFAULT_UPLOAD_FINALIZATION_TIMEOUT_MS
          )
        );

      this.retryBaseDelayMilliseconds =
        Math.max(
          100,
          resolvedSafeInteger(
            options.retryBaseDelayMilliseconds,
            DEFAULT_RETRY_BASE_DELAY_MS
          )
        );

      this.retryMaximumDelayMilliseconds =
        Math.max(
          this.retryBaseDelayMilliseconds,
          resolvedSafeInteger(
            options.retryMaximumDelayMilliseconds,
            DEFAULT_RETRY_MAX_DELAY_MS
          )
        );

      this.retryJitterRatio =
        resolvedClampNumber(
          resolvedSafeNumber(
            options.retryJitterRatio,
            DEFAULT_RETRY_JITTER_RATIO
          ),
          0,
          1
        );

      this.progressThrottleMilliseconds =
        Math.max(
          0,
          resolvedSafeInteger(
            options.progressThrottleMilliseconds,
            DEFAULT_PROGRESS_THROTTLE_MS
          )
        );

      this.sessionStorageKey =
        resolvedSafeString(
          options.sessionStorageKey,
          CHUNK_SESSION_STORAGE_KEY
        );

      this.sessionPersistDebounceMilliseconds =
        Math.max(
          0,
          resolvedSafeInteger(
            options.sessionPersistDebounceMilliseconds,
            DEFAULT_SESSION_PERSIST_DEBOUNCE_MS
          )
        );

      this.staleSessionAgeMilliseconds =
        Math.max(
          60000,
          resolvedSafeInteger(
            options.staleSessionAgeMilliseconds,
            DEFAULT_STALE_SESSION_AGE_MS
          )
        );

      this.endpoints = {
        initialize:
          resolvedSafeString(
            options.initializeEndpoint,
            resolveEndpoint(
              "initializeUpload",
              "/media/uploads/initialize"
            )
          ),

        uploadChunk:
          resolvedSafeString(
            options.uploadChunkEndpoint,
            resolveEndpoint(
              "uploadChunk",
              "/media/uploads/chunk"
            )
          ),

        finalize:
          resolvedSafeString(
            options.finalizeEndpoint,
            resolveEndpoint(
              "finalizeUpload",
              "/media/uploads/finalize"
            )
          ),

        cancel:
          resolvedSafeString(
            options.cancelEndpoint,
            resolveEndpoint(
              "cancelUpload",
              "/media/uploads/cancel"
            )
          ),

        status:
          resolvedSafeString(
            options.statusEndpoint,
            resolveEndpoint(
              "uploadStatus",
              "/media/uploads/status"
            )
          )
      };

      this.sessions =
        new Map();

      this.activeRunPromises =
        new Map();

      this.sessionPersistTimer =
        null;

      this.destroyed =
        false;

      this.restoreSessions();
    }

    assertAvailable() {
      if (
        this.destroyed
      ) {
        throw createChunkUploadError(
          "The chunked upload engine has been destroyed.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.UNKNOWN
          }
        );
      }
    }

    getSession(
      sessionId
    ) {
      return this.sessions.get(
        resolvedSafeString(
          sessionId
        )
      ) ||
      null;
    }

    getSessionByQueueItem(
      queueItemId
    ) {
      const normalizedQueueItemId =
        resolvedSafeString(
          queueItemId
        );

      for (
        const session
        of this.sessions.values()
      ) {
        if (
          session.queueItemId ===
          normalizedQueueItemId
        ) {
          return session;
        }
      }

      return null;
    }

    getSessions(
      options = {}
    ) {
      let sessions =
        Array.from(
          this.sessions.values()
        );

      if (
        options.state
      ) {
        const states =
          new Set(
            resolvedNormalizeArray(
              options.state
            )
              .map(
                state =>
                  normalizeSessionState(
                    state
                  )
              )
          );

        sessions =
          sessions.filter(
            session =>
              states.has(
                session.state
              )
          );
      }

      if (
        options.queueItemId
      ) {
        const queueItemId =
          resolvedSafeString(
            options.queueItemId
          );

        sessions =
          sessions.filter(
            session =>
              session.queueItemId ===
              queueItemId
          );
      }

      return sessions.sort(
        (
          firstSession,
          secondSession
        ) =>
          (
            Date.parse(
              firstSession.createdAt
            ) ||
            0
          ) -
          (
            Date.parse(
              secondSession.createdAt
            ) ||
            0
          )
      );
    }

    createSession(
      itemOrId,
      options = {}
    ) {
      this.assertAvailable();

      const queueItem =
        resolveUploadQueueItem(
          itemOrId
        );

      if (
        !queueItem
      ) {
        throw createChunkUploadError(
          "The upload queue item could not be found.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.INVALID_FILE
          }
        );
      }

      if (
        !queueItem.hasFile?.() &&
        !queueItem.file
      ) {
        throw createChunkUploadError(
          `The file for "${queueItem.name}" is unavailable.`,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.FILE_UNAVAILABLE,

            details: {
              queueItemId:
                queueItem.id
            }
          }
        );
      }

      const existingSession =
        this.getSessionByQueueItem(
          queueItem.id
        );

      if (
        existingSession &&
        options.replace !==
          true
      ) {
        return existingSession;
      }

      if (
        existingSession &&
        options.replace ===
          true
      ) {
        this.removeSession(
          existingSession.id,
          {
            cancel:
              true
          }
        );
      }

      const session =
        new ChunkedUploadSession(
          queueItem,
          {
            ...options,

            chunkSize:
              options.chunkSize ||
              this.chunkSize,

            maximumParallelChunks:
              options.maximumParallelChunks ||
              this.maximumParallelChunks,

            maximumChunkAttempts:
              options.maximumChunkAttempts ||
              this.maximumChunkAttempts
          }
        );

      this.sessions.set(
        session.id,
        session
      );

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_CREATED,
        {
          session:
            session.toJSON()
        }
      );

      for (
        const chunk
        of session.chunks
      ) {
        this.emit(
          CHUNKED_UPLOAD_EVENTS.CHUNK_CREATED,
          {
            sessionId:
              session.id,

            chunk:
              chunk.toJSON()
          }
        );
      }

      this.schedulePersistSessions();

      return session;
    }

    async initializeSession(
      sessionOrId,
      options = {}
    ) {
      this.assertAvailable();

      const session =
        resolvedIsObject(
          sessionOrId
        )
          ? sessionOrId
          : this.getSession(
              sessionOrId
            );

      if (
        !session
      ) {
        throw createChunkUploadError(
          "The upload session could not be found.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.SESSION_INVALID
          }
        );
      }

      if (
        session.remoteUploadId &&
        options.force !==
          true
      ) {
        session.setState(
          CHUNK_UPLOAD_STATE.READY
        );

        return session;
      }

      const queueItem =
        this.queue.get(
          session.queueItemId
        );

      if (
        !queueItem ||
        !queueItem.file
      ) {
        throw createChunkUploadError(
          `The file for "${session.fileName}" is unavailable.`,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.FILE_UNAVAILABLE
          }
        );
      }

      session.setState(
        CHUNK_UPLOAD_STATE.INITIALIZING
      );

      this.queue.setStatus(
        queueItem.id,
        uploadStatuses.PREPARING,
        {
          force:
            true,

          reason:
            "chunk-session-initializing"
        }
      );

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_INITIALIZING,
        {
          session:
            session.toJSON()
        }
      );

      try {
        const initializationResponse =
          await this.api.request(
            this.endpoints.initialize,
            {
              method:
                "POST",

              timeoutMilliseconds:
                this.initializationTimeoutMilliseconds,

              body: {
                classId:
                  session.classId,

                queueItemId:
                  session.queueItemId,

                fileName:
                  session.fileName,

                mimeType:
                  session.mimeType,

                fileSize:
                  session.fileSize,

                fingerprint:
                  session.fileFingerprint,

                chunkSize:
                  session.chunkSize,

                totalChunks:
                  session.totalChunks,

                folderId:
                  queueItem.folderId ||
                  null,

                tags:
                  queueItem.tags ||
                  [],

                metadata:
                  queueItem.metadata ||
                  {}
              },

              requestKey:
                `chunk-upload-initialize:${session.id}`
            }
          );

        const responseData =
          normalizeServerResponse(
            initializationResponse
          );

        session.remoteUploadId =
          resolvedSafeString(
            responseData.uploadId ||
            responseData.remoteUploadId ||
            responseData.sessionId
          );

        if (
          !session.remoteUploadId
        ) {
          throw createChunkUploadError(
            "The upload server did not return an upload session ID.",
            {
              code:
                CHUNKED_UPLOAD_ERROR_CODE.RESPONSE_INVALID,

              details: {
                response:
                  responseData
              }
            }
          );
        }

        session.remoteMediaId =
          resolvedSafeString(
            responseData.mediaId ||
            responseData.remoteMediaId
          );

        session.uploadUrl =
          resolvedSafeString(
            responseData.uploadUrl ||
            responseData.chunkUploadUrl,
            session.uploadUrl
          );

        session.finalizeUrl =
          resolvedSafeString(
            responseData.finalizeUrl,
            session.finalizeUrl
          );

        session.cancelUrl =
          resolvedSafeString(
            responseData.cancelUrl,
            session.cancelUrl
          );

        session.uploadHeaders =
          resolvedIsObject(
            responseData.uploadHeaders
          )
            ? resolvedDeepClone(
                responseData.uploadHeaders
              )
            : session.uploadHeaders;

        session.serverMetadata =
          resolvedIsObject(
            responseData.metadata
          )
            ? resolvedDeepClone(
                responseData.metadata
              )
            : {};

        if (
          responseData.chunkSize
        ) {
          const serverChunkSize =
            normalizeChunkSize(
              responseData.chunkSize
            );

          if (
            serverChunkSize !==
            session.chunkSize
          ) {
            session.chunkSize =
              serverChunkSize;

            session.totalChunks =
              calculateChunkCount(
                session.fileSize,
                serverChunkSize
              );

            session.createChunks(
              responseData.chunks
            );
          }
        } else if (
          Array.isArray(
            responseData.chunks
          )
        ) {
          session.createChunks(
            responseData.chunks
          );
        }

        session.setState(
          CHUNK_UPLOAD_STATE.READY
        );

        queueItem.remoteUploadId =
          session.remoteUploadId;

        this.emit(
          CHUNKED_UPLOAD_EVENTS.SESSION_READY,
          {
            session:
              session.toJSON(),

            response:
              resolvedDeepClone(
                responseData
              )
          }
        );

        this.schedulePersistSessions();

        return session;
      } catch (
        initializationError
      ) {
        const normalizedError =
          resolvedNormalizeError(
            initializationError,
            "The upload session could not be initialized."
          );

        session.setState(
          CHUNK_UPLOAD_STATE.FAILED,
          {
            error:
              normalizedError
          }
        );

        this.queue.fail(
          queueItem.id,
          normalizedError,
          {
            force:
              true,

            reason:
              "chunk-session-initialization-failed"
          }
        );

        this.emit(
          CHUNKED_UPLOAD_EVENTS.SESSION_FAILED,
          {
            session:
              session.toJSON(),

            error:
              normalizedError
          }
        );

        this.schedulePersistSessions();

        throw createChunkUploadError(
          normalizedError.message,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.SESSION_INITIALIZATION_FAILED,

            retryable:
              isRetryableError(
                initializationError
              ),

            cause:
              initializationError
          }
        );
      }
    }

    async start(
      itemOrSessionId,
      options = {}
    ) {
      this.assertAvailable();

      let session =
        this.getSession(
          itemOrSessionId
        );

      if (
        !session
      ) {
        const queueItem =
          resolveUploadQueueItem(
            itemOrSessionId
          );

        if (
          !queueItem
        ) {
          throw createChunkUploadError(
            "The upload queue item could not be found.",
            {
              code:
                CHUNKED_UPLOAD_ERROR_CODE.INVALID_FILE
            }
          );
        }

        session =
          this.createSession(
            queueItem,
            options
          );
      }

      if (
        this.activeRunPromises.has(
          session.id
        )
      ) {
        return this.activeRunPromises.get(
          session.id
        );
      }

      const runPromise =
        this.runSession(
          session,
          options
        );

      this.activeRunPromises.set(
        session.id,
        runPromise
      );

      try {
        return await runPromise;
      } finally {
        this.activeRunPromises.delete(
          session.id
        );
      }
    }

    async runSession(
      session,
      options = {}
    ) {
      const queueItem =
        this.queue.get(
          session.queueItemId
        );

      if (
        !queueItem ||
        !queueItem.file
      ) {
        throw createChunkUploadError(
          `The file for "${session.fileName}" is unavailable.`,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.FILE_UNAVAILABLE
          }
        );
      }

      if (
        !session.remoteUploadId ||
        options.reinitialize ===
          true
      ) {
        await this.initializeSession(
          session,
          {
            force:
              options.reinitialize ===
              true
          }
        );
      }

      if (
        session.state ===
        CHUNK_UPLOAD_STATE.COMPLETED
      ) {
        return session;
      }

      session.resetFailedChunks();

      session.setState(
        CHUNK_UPLOAD_STATE.UPLOADING
      );

      this.queue.setStatus(
        queueItem.id,
        uploadStatuses.UPLOADING,
        {
          force:
            true,

          reason:
            "chunk-upload-started"
        }
      );

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_UPDATED,
        {
          session:
            session.toJSON()
        }
      );

      try {
        while (
          !session.isComplete
        ) {
          if (
            session.state ===
            CHUNK_UPLOAD_STATE.PAUSED
          ) {
            throw createChunkUploadError(
              "The upload has been paused.",
              {
                code:
                  CHUNKED_UPLOAD_ERROR_CODE.PAUSED
              }
            );
          }

          if (
            session.state ===
            CHUNK_UPLOAD_STATE.CANCELED
          ) {
            throw createChunkUploadError(
              "The upload has been canceled.",
              {
                code:
                  CHUNKED_UPLOAD_ERROR_CODE.ABORTED
              }
            );
          }

          const availableSlots =
            Math.max(
              0,
              session.maximumParallelChunks -
              session.activeChunks.length
            );

          const nextChunks =
            session.getNextChunks(
              availableSlots
            );

          if (
            !nextChunks.length
          ) {
            if (
              session.activeChunks.length
            ) {
              await resolvedDelay(
                25
              );

              continue;
            }

            if (
              session.hasFailedChunks
            ) {
              const unrecoverableChunks =
                session.failedChunks
                  .filter(
                    chunk =>
                      !chunk.canRetry()
                  );

              if (
                unrecoverableChunks.length
              ) {
                throw createChunkUploadError(
                  `${unrecoverableChunks.length} upload chunk${unrecoverableChunks.length === 1 ? "" : "s"} could not be uploaded.`,
                  {
                    code:
                      CHUNKED_UPLOAD_ERROR_CODE.CHUNK_FAILED,

                    details: {
                      chunks:
                        unrecoverableChunks
                          .map(
                            chunk =>
                              chunk.toJSON()
                          )
                    }
                  }
                );
              }

              session.resetFailedChunks();

              continue;
            }

            throw createChunkUploadError(
              "The upload session has no remaining chunks but is not complete.",
              {
                code:
                  CHUNKED_UPLOAD_ERROR_CODE.SESSION_INVALID
              }
            );
          }

          await Promise.all(
            nextChunks.map(
              chunk =>
                this.uploadChunkWithRetry(
                  session,
                  chunk,
                  queueItem,
                  options
                )
            )
          );
        }

        return await this.finalizeSession(
          session,
          options
        );
      } catch (
        sessionError
      ) {
        if (
          sessionError?.code ===
          CHUNKED_UPLOAD_ERROR_CODE.PAUSED
        ) {
          return session;
        }

        if (
          isAbortError(
            sessionError
          ) &&
          session.state ===
            CHUNK_UPLOAD_STATE.CANCELED
        ) {
          return session;
        }

        const normalizedError =
          resolvedNormalizeError(
            sessionError,
            "The chunked upload failed."
          );

        session.setState(
          CHUNK_UPLOAD_STATE.FAILED,
          {
            error:
              normalizedError
          }
        );

        this.queue.fail(
          queueItem.id,
          normalizedError,
          {
            force:
              true,

            reason:
              "chunk-upload-session-failed"
          }
        );

        this.emit(
          CHUNKED_UPLOAD_EVENTS.SESSION_FAILED,
          {
            session:
              session.toJSON(),

            error:
              normalizedError
          }
        );

        this.schedulePersistSessions();

        throw sessionError;
      }
    }

    async uploadChunkWithRetry(
      session,
      chunk,
      queueItem,
      options = {}
    ) {
      let lastError =
        null;

      while (
        chunk.attempt <
        chunk.maximumAttempts
      ) {
        if (
          session.state ===
          CHUNK_UPLOAD_STATE.PAUSED
        ) {
          throw createChunkUploadError(
            "The upload has been paused.",
            {
              code:
                CHUNKED_UPLOAD_ERROR_CODE.PAUSED
            }
          );
        }

        if (
          session.state ===
          CHUNK_UPLOAD_STATE.CANCELED
        ) {
          throw createChunkUploadError(
            "The upload has been canceled.",
            {
              code:
                CHUNKED_UPLOAD_ERROR_CODE.ABORTED
            }
          );
        }

        try {
          return await this.uploadChunk(
            session,
            chunk,
            queueItem,
            options
          );
        } catch (
          chunkError
        ) {
          lastError =
            chunkError;

          if (
            isAbortError(
              chunkError
            ) ||
            session.state ===
              CHUNK_UPLOAD_STATE.PAUSED ||
            session.state ===
              CHUNK_UPLOAD_STATE.CANCELED
          ) {
            throw chunkError;
          }

          const retryable =
            isRetryableError(
              chunkError
            );

          if (
            !retryable ||
            chunk.attempt >=
              chunk.maximumAttempts
          ) {
            chunk.markFailed(
              chunkError
            );

            this.emit(
              CHUNKED_UPLOAD_EVENTS.CHUNK_FAILED,
              {
                sessionId:
                  session.id,

                chunk:
                  chunk.toJSON(),

                error:
                  resolvedNormalizeError(
                    chunkError
                  )
              }
            );

            this.schedulePersistSessions();

            throw chunkError;
          }

          const retryDelay =
            calculateRetryDelay(
              chunk.attempt,
              {
                baseDelayMilliseconds:
                  this.retryBaseDelayMilliseconds,

                maximumDelayMilliseconds:
                  this.retryMaximumDelayMilliseconds,

                jitterRatio:
                  this.retryJitterRatio
              }
            );

          this.emit(
            CHUNKED_UPLOAD_EVENTS.CHUNK_RETRYING,
            {
              sessionId:
                session.id,

              chunk:
                chunk.toJSON(),

              delayMilliseconds:
                retryDelay,

              error:
                resolvedNormalizeError(
                  chunkError
                )
            }
          );

          await resolvedDelay(
            retryDelay
          );

          chunk.status =
            CHUNK_STATUS.PENDING;

          chunk.uploadedBytes =
            0;

          chunk.error =
            null;
        }
      }

      throw lastError ||
      createChunkUploadError(
        "The chunk upload failed after all retry attempts.",
        {
          code:
            CHUNKED_UPLOAD_ERROR_CODE.CHUNK_FAILED
        }
      );
    }

    async uploadChunk(
      session,
      chunk,
      queueItem,
      options = {}
    ) {
      if (
        !queueItem.file
      ) {
        throw createChunkUploadError(
          `The file for "${queueItem.name}" is unavailable.`,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.FILE_UNAVAILABLE
          }
        );
      }

      chunk.markQueued();

      this.emit(
        CHUNKED_UPLOAD_EVENTS.CHUNK_QUEUED,
        {
          sessionId:
            session.id,

          chunk:
            chunk.toJSON()
        }
      );

      const chunkBlob =
        queueItem.file.slice(
          chunk.start,
          chunk.end,
          session.mimeType
        );

      if (
        chunkBlob.size !==
        chunk.size
      ) {
        throw createChunkUploadError(
          `Chunk ${chunk.number} has an invalid byte size.`,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.CHUNK_FAILED,

            details: {
              expectedSize:
                chunk.size,

              actualSize:
                chunkBlob.size
            }
          }
        );
      }

      chunk.markStarted();

      const controller =
        new AbortController();

      chunk.controller =
        controller;

      this.emit(
        CHUNKED_UPLOAD_EVENTS.CHUNK_STARTED,
        {
          sessionId:
            session.id,

          chunk:
            chunk.toJSON()
        }
      );

      const uploadUrl =
        this.buildChunkUploadUrl(
          session,
          chunk
        );

      const headers =
        this.buildChunkHeaders(
          session,
          chunk
        );

      let lastProgressEmission =
        0;

      try {
        const response =
          await this.transport.upload({
            url:
              uploadUrl,

            method:
              options.chunkMethod ||
              "PUT",

            body:
              chunkBlob,

            contentType:
              session.mimeType,

            headers,

            controller,

            timeoutMilliseconds:
              options.chunkUploadTimeoutMilliseconds ||
              this.chunkUploadTimeoutMilliseconds,

            onRequestCreated:
              request => {
                chunk.request =
                  request;
              },

            onProgress:
              progressData => {
                chunk.setProgress(
                  progressData.loaded
                );

                session.lastProgressAt =
                  nowIsoString();

                const currentTimestamp =
                  Date.now();

                if (
                  currentTimestamp -
                  lastProgressEmission <
                  this.progressThrottleMilliseconds &&
                  progressData.loaded <
                  progressData.total
                ) {
                  return;
                }

                lastProgressEmission =
                  currentTimestamp;

                this.handleChunkProgress(
                  session,
                  chunk,
                  queueItem
                );
              }
          });

        const responseBody =
          normalizeServerResponse(
            response.body
          );

        chunk.markCompleted({
          ...responseBody,

          etag:
            response.etag ||
            responseBody.etag
        });

        chunk.controller =
          null;

        chunk.request =
          null;

        this.handleChunkProgress(
          session,
          chunk,
          queueItem
        );

        this.emit(
          CHUNKED_UPLOAD_EVENTS.CHUNK_COMPLETED,
          {
            sessionId:
              session.id,

            chunk:
              chunk.toJSON(),

            response:
              resolvedDeepClone(
                responseBody
              )
          }
        );

        this.schedulePersistSessions();

        return chunk;
      } catch (
        uploadError
      ) {
        chunk.controller =
          null;

        chunk.request =
          null;

        if (
          isAbortError(
            uploadError
          )
        ) {
          if (
            session.state ===
            CHUNK_UPLOAD_STATE.PAUSED
          ) {
            chunk.status =
              CHUNK_STATUS.PENDING;

            chunk.uploadedBytes =
              0;

            throw createChunkUploadError(
              "The upload was paused.",
              {
                code:
                  CHUNKED_UPLOAD_ERROR_CODE.PAUSED
              }
            );
          }

          if (
            session.state ===
            CHUNK_UPLOAD_STATE.CANCELED
          ) {
            chunk.markCanceled();

            throw createChunkUploadError(
              "The upload was canceled.",
              {
                code:
                  CHUNKED_UPLOAD_ERROR_CODE.ABORTED
              }
            );
          }
        }

        chunk.markFailed(
          uploadError
        );

        throw uploadError;
      }
    }

    buildChunkUploadUrl(
      session,
      chunk
    ) {
      if (
        session.uploadUrl
      ) {
        return session.uploadUrl
          .replace(
            "{uploadId}",
            encodeURIComponent(
              session.remoteUploadId
            )
          )
          .replace(
            "{chunkIndex}",
            String(
              chunk.index
            )
          )
          .replace(
            "{chunkNumber}",
            String(
              chunk.number
            )
          );
      }

      const baseUrl =
        buildAbsoluteApiUrl(
          this.endpoints.uploadChunk
        );

      const url =
        new URL(
          baseUrl,
          windowObject.location.href
        );

      url.searchParams.set(
        "uploadId",
        session.remoteUploadId
      );

      url.searchParams.set(
        "chunkIndex",
        String(
          chunk.index
        )
      );

      url.searchParams.set(
        "chunkNumber",
        String(
          chunk.number
        )
      );

      url.searchParams.set(
        "totalChunks",
        String(
          session.totalChunks
        )
      );

      return url.toString();
    }

    buildChunkHeaders(
      session,
      chunk
    ) {
      const headers = {
        ...session.uploadHeaders,

        "X-AIFT-Upload-Id":
          session.remoteUploadId,

        "X-AIFT-Chunk-Index":
          String(
            chunk.index
          ),

        "X-AIFT-Chunk-Number":
          String(
            chunk.number
          ),

        "X-AIFT-Chunk-Count":
          String(
            session.totalChunks
          ),

        "X-AIFT-Chunk-Start":
          String(
            chunk.start
          ),

        "X-AIFT-Chunk-End":
          String(
            chunk.end
          ),

        "X-AIFT-File-Size":
          String(
            session.fileSize
          ),

        "Content-Range":
          `bytes ${chunk.start}-${Math.max(chunk.start, chunk.end - 1)}/${session.fileSize}`
      };

      const authenticationToken =
        resolveAuthenticationToken();

      if (
        authenticationToken &&
        !Object.keys(
          headers
        ).some(
          headerName =>
            headerName
              .toLowerCase() ===
            "authorization"
        )
      ) {
        headers.Authorization =
          `Bearer ${authenticationToken}`;
      }

      return headers;
    }

    handleChunkProgress(
      session,
      chunk,
      queueItem
    ) {
      const uploadedBytes =
        session.uploadedBytes;

      const progress =
        session.progress;

      this.queue.setProgress(
        queueItem.id,
        progress,
        {
          uploadedBytes,

          totalBytes:
            session.fileSize,

          persist:
            true,

          notifySubscribers:
            true
        }
      );

      this.emit(
        CHUNKED_UPLOAD_EVENTS.CHUNK_PROGRESS,
        {
          sessionId:
            session.id,

          chunk:
            chunk.toJSON(),

          uploadedBytes,

          totalBytes:
            session.fileSize,

          progress
        }
      );

      this.emit(
        CHUNKED_UPLOAD_EVENTS.ENGINE_PROGRESS,
        {
          session:
            session.toJSON(),

          queueItem:
            queueItem.toPublicJSON
              ? queueItem.toPublicJSON()
              : queueItem
        }
      );
    }

    async finalizeSession(
      sessionOrId,
      options = {}
    ) {
      const session =
        resolvedIsObject(
          sessionOrId
        )
          ? sessionOrId
          : this.getSession(
              sessionOrId
            );

      if (
        !session
      ) {
        throw createChunkUploadError(
          "The upload session could not be found.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.SESSION_INVALID
          }
        );
      }

      if (
        !session.isComplete
      ) {
        throw createChunkUploadError(
          "The upload cannot be finalized until every chunk is complete.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.FINALIZATION_FAILED,

            details: {
              completedChunks:
                session.completedChunks
                  .length,

              totalChunks:
                session.totalChunks
            }
          }
        );
      }

      const queueItem =
        this.queue.get(
          session.queueItemId
        );

      session.setState(
        CHUNK_UPLOAD_STATE.FINALIZING
      );

      if (
        queueItem
      ) {
        this.queue.setStatus(
          queueItem.id,
          uploadStatuses.PROCESSING,
          {
            force:
              true,

            reason:
              "chunk-upload-finalizing"
          }
        );
      }

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_FINALIZING,
        {
          session:
            session.toJSON()
        }
      );

      const finalizeEndpoint =
        session.finalizeUrl ||
        this.endpoints.finalize;

      try {
        const finalizeResponse =
          await this.api.request(
            finalizeEndpoint,
            {
              method:
                "POST",

              timeoutMilliseconds:
                options.finalizationTimeoutMilliseconds ||
                this.finalizationTimeoutMilliseconds,

              body: {
                uploadId:
                  session.remoteUploadId,

                queueItemId:
                  session.queueItemId,

                classId:
                  session.classId,

                fileName:
                  session.fileName,

                fileSize:
                  session.fileSize,

                mimeType:
                  session.mimeType,

                fingerprint:
                  session.fileFingerprint,

                chunks:
                  session.completedChunks
                    .sort(
                      (
                        firstChunk,
                        secondChunk
                      ) =>
                        firstChunk.index -
                        secondChunk.index
                    )
                    .map(
                      chunk => ({
                        index:
                          chunk.index,

                        number:
                          chunk.number,

                        size:
                          chunk.size,

                        etag:
                          chunk.etag,

                        checksum:
                          chunk.checksum,

                        partId:
                          chunk.remotePartId
                      })
                    )
              },

              requestKey:
                `chunk-upload-finalize:${session.id}`
            }
          );

        const result =
          normalizeServerResponse(
            finalizeResponse
          );

        session.remoteMediaId =
          resolvedSafeString(
            result.mediaId ||
            result.id ||
            result.remoteMediaId,
            session.remoteMediaId
          );

        session.serverMetadata = {
          ...session.serverMetadata,
          finalizeResult:
            resolvedDeepClone(
              result
            )
        };

        session.setState(
          CHUNK_UPLOAD_STATE.COMPLETED
        );

        if (
          queueItem
        ) {
          this.queue.complete(
            queueItem.id,
            {
              ...result,

              uploadId:
                session.remoteUploadId,

              mediaId:
                session.remoteMediaId
            },
            {
              force:
                true,

              reason:
                "chunk-upload-completed"
            }
          );
        }

        this.emit(
          CHUNKED_UPLOAD_EVENTS.SESSION_COMPLETED,
          {
            session:
              session.toJSON(),

            result:
              resolvedDeepClone(
                result
              )
          }
        );

        this.schedulePersistSessions();

        return session;
      } catch (
        finalizationError
      ) {
        const normalizedError =
          resolvedNormalizeError(
            finalizationError,
            "The uploaded file could not be finalized."
          );

        session.setState(
          CHUNK_UPLOAD_STATE.FAILED,
          {
            error:
              normalizedError
          }
        );

        if (
          queueItem
        ) {
          this.queue.fail(
            queueItem.id,
            normalizedError,
            {
              force:
                true,

              reason:
                "chunk-upload-finalization-failed"
            }
          );
        }

        this.emit(
          CHUNKED_UPLOAD_EVENTS.SESSION_FAILED,
          {
            session:
              session.toJSON(),

            error:
              normalizedError
          }
        );

        this.schedulePersistSessions();

        throw createChunkUploadError(
          normalizedError.message,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.FINALIZATION_FAILED,

            retryable:
              isRetryableError(
                finalizationError
              ),

            cause:
              finalizationError
          }
        );
      }
    }

    pause(
      sessionOrItemId
    ) {
      const session =
        this.getSession(
          sessionOrItemId
        ) ||
        this.getSessionByQueueItem(
          sessionOrItemId
        );

      if (
        !session
      ) {
        return null;
      }

      session.setState(
        CHUNK_UPLOAD_STATE.PAUSING
      );

      for (
        const chunk
        of session.activeChunks
      ) {
        if (
          chunk.controller
        ) {
          chunk.controller.abort();
        }
      }

      session.setState(
        CHUNK_UPLOAD_STATE.PAUSED
      );

      const queueItem =
        this.queue.get(
          session.queueItemId
        );

      if (
        queueItem
      ) {
        this.queue.pause(
          queueItem.id,
          {
            force:
              true,

            reason:
              "chunk-upload-paused"
          }
        );
      }

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_PAUSED,
        {
          session:
            session.toJSON()
        }
      );

      this.schedulePersistSessions();

      return session;
    }

    async resume(
      sessionOrItemId,
      options = {}
    ) {
      const session =
        this.getSession(
          sessionOrItemId
        ) ||
        this.getSessionByQueueItem(
          sessionOrItemId
        );

      if (
        !session
      ) {
        throw createChunkUploadError(
          "The upload session could not be found.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.SESSION_INVALID
          }
        );
      }

      const queueItem =
        this.queue.get(
          session.queueItemId
        );

      if (
        !queueItem ||
        !queueItem.file
      ) {
        throw createChunkUploadError(
          `The original file for "${session.fileName}" must be selected again before resuming.`,
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.FILE_UNAVAILABLE
          }
        );
      }

      for (
        const chunk
        of session.chunks
      ) {
        if (
          chunk.status ===
            CHUNK_STATUS.UPLOADING ||
          chunk.status ===
            CHUNK_STATUS.CANCELED
        ) {
          chunk.status =
            CHUNK_STATUS.PENDING;

          chunk.uploadedBytes =
            0;

          chunk.error =
            null;
        }

        if (
          chunk.status ===
            CHUNK_STATUS.FAILED &&
          chunk.canRetry()
        ) {
          chunk.status =
            CHUNK_STATUS.PENDING;

          chunk.uploadedBytes =
            0;

          chunk.error =
            null;
        }
      }

      session.error =
        null;

      session.setState(
        CHUNK_UPLOAD_STATE.READY
      );

      this.queue.resume(
        queueItem.id,
        {
          force:
            true,

          reason:
            "chunk-upload-resumed"
        }
      );

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_RESUMED,
        {
          session:
            session.toJSON()
        }
      );

      this.schedulePersistSessions();

      return this.start(
        session.id,
        options
      );
    }

    async cancel(
      sessionOrItemId,
      options = {}
    ) {
      const session =
        this.getSession(
          sessionOrItemId
        ) ||
        this.getSessionByQueueItem(
          sessionOrItemId
        );

      if (
        !session
      ) {
        return null;
      }

      session.setState(
        CHUNK_UPLOAD_STATE.CANCELED
      );

      for (
        const chunk
        of session.activeChunks
      ) {
        if (
          chunk.controller
        ) {
          chunk.controller.abort();
        }

        chunk.markCanceled();
      }

      const queueItem =
        this.queue.get(
          session.queueItemId
        );

      if (
        queueItem
      ) {
        this.queue.cancel(
          queueItem.id,
          {
            force:
              true,

            reason:
              "chunk-upload-canceled"
          }
        );
      }

      if (
        session.remoteUploadId &&
        options.notifyServer !==
          false
      ) {
        try {
          await this.api.request(
            session.cancelUrl ||
            this.endpoints.cancel,
            {
              method:
                "POST",

              body: {
                uploadId:
                  session.remoteUploadId,

                queueItemId:
                  session.queueItemId,

                reason:
                  resolvedSafeString(
                    options.reason,
                    "user-canceled"
                  )
              },

              requestKey:
                `chunk-upload-cancel:${session.id}`
            }
          );
        } catch (
          cancelRequestError
        ) {
          console.warn(
            "[AIFT Media Library] Remote upload cancellation failed:",
            cancelRequestError
          );
        }
      }

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_CANCELED,
        {
          session:
            session.toJSON()
        }
      );

      this.schedulePersistSessions();

      return session;
    }

    removeSession(
      sessionId,
      options = {}
    ) {
      const session =
        this.getSession(
          sessionId
        );

      if (
        !session
      ) {
        return null;
      }

      if (
        options.cancel ===
          true &&
        ![
          CHUNK_UPLOAD_STATE.COMPLETED,
          CHUNK_UPLOAD_STATE.CANCELED,
          CHUNK_UPLOAD_STATE.FAILED
        ].includes(
          session.state
        )
      ) {
        for (
          const chunk
          of session.activeChunks
        ) {
          if (
            chunk.controller
          ) {
            chunk.controller.abort();
          }
        }
      }

      session.setState(
        CHUNK_UPLOAD_STATE.DESTROYED
      );

      this.sessions.delete(
        session.id
      );

      this.activeRunPromises.delete(
        session.id
      );

      this.emit(
        CHUNKED_UPLOAD_EVENTS.SESSION_REMOVED,
        {
          session:
            session.toJSON()
        }
      );

      this.schedulePersistSessions();

      return session;
    }

    replaceSessionFile(
      sessionOrItemId,
      file
    ) {
      const session =
        this.getSession(
          sessionOrItemId
        ) ||
        this.getSessionByQueueItem(
          sessionOrItemId
        );

      if (
        !session
      ) {
        throw createChunkUploadError(
          "The upload session could not be found.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.SESSION_INVALID
          }
        );
      }

      const queueItem =
        this.queue.replaceFile(
          session.queueItemId,
          file,
          {
            resetProgress:
              false,

            reason:
              "chunk-session-file-restored"
          }
        );

      if (
        queueItem.size !==
        session.fileSize
      ) {
        throw createChunkUploadError(
          "The selected file does not match the original file size.",
          {
            code:
              CHUNKED_UPLOAD_ERROR_CODE.INVALID_FILE,

            details: {
              expectedSize:
                session.fileSize,

              actualSize:
                queueItem.size
            }
          }
        );
      }

      session.fileName =
        queueItem.name;

      session.mimeType =
        queueItem.mimeType;

      session.fileFingerprint =
        queueItem.fingerprint ||
        queueItem.basicFingerprint;

      session.state =
        CHUNK_UPLOAD_STATE.PAUSED;

      session.error =
        null;

      session.updatedAt =
        nowIsoString();

      this.schedulePersistSessions();

      return session;
    }

    schedulePersistSessions() {
      if (
        this.sessionPersistTimer
      ) {
        windowObject.clearTimeout(
          this.sessionPersistTimer
        );
      }

      this.sessionPersistTimer =
        windowObject.setTimeout(
          () => {
            this.sessionPersistTimer =
              null;

            this.persistSessions();
          },
          this.sessionPersistDebounceMilliseconds
        );
    }

    persistSessions() {
      const payload = {
        version:
          CHUNKED_UPLOAD_VERSION,

        savedAt:
          nowIsoString(),

        sessions:
          this.getSessions()
            .filter(
              session =>
                session.state !==
                CHUNK_UPLOAD_STATE.DESTROYED
            )
            .map(
              session =>
                session.toJSON()
            )
      };

      try {
        windowObject.localStorage
          .setItem(
            this.sessionStorageKey,
            JSON.stringify(
              payload
            )
          );

        return true;
      } catch (
        persistenceError
      ) {
        this.emit(
          CHUNKED_UPLOAD_EVENTS.PERSISTENCE_FAILED,
          {
            error:
              resolvedNormalizeError(
                persistenceError
              )
          }
        );

        return false;
      }
    }

    restoreSessions() {
      let rawValue =
        null;

      try {
        rawValue =
          windowObject.localStorage
            .getItem(
              this.sessionStorageKey
            );
      } catch (
        storageReadError
      ) {
        console.warn(
          "[AIFT Media Library] Chunk session storage could not be read:",
          storageReadError
        );

        return;
      }

      if (
        !rawValue
      ) {
        return;
      }

      let parsedValue;

      try {
        parsedValue =
          JSON.parse(
            rawValue
          );
      } catch (
        parseError
      ) {
        console.warn(
          "[AIFT Media Library] Saved chunk sessions are invalid:",
          parseError
        );

        return;
      }

      const currentTimestamp =
        Date.now();

      for (
        const sessionData
        of resolvedNormalizeArray(
          parsedValue.sessions
        )
      ) {
        if (
          !resolvedIsObject(
            sessionData
          )
        ) {
          continue;
        }

        const sessionUpdatedAt =
          Date.parse(
            sessionData.updatedAt
          ) ||
          0;

        if (
          sessionUpdatedAt &&
          currentTimestamp -
            sessionUpdatedAt >
            this.staleSessionAgeMilliseconds
        ) {
          continue;
        }

        const queueItem =
          this.queue.get(
            sessionData.queueItemId
          );

        if (
          !queueItem
        ) {
          continue;
        }

        try {
          const session =
            ChunkedUploadSession.restore(
              queueItem,
              {
                ...sessionData,

                state:
                  sessionData.state ===
                  CHUNK_UPLOAD_STATE.COMPLETED
                    ? CHUNK_UPLOAD_STATE.COMPLETED
                    : CHUNK_UPLOAD_STATE.PAUSED
              }
            );

          this.sessions.set(
            session.id,
            session
          );

          this.emit(
            CHUNKED_UPLOAD_EVENTS.SESSION_RESTORED,
            {
              session:
                session.toJSON()
            }
          );
        } catch (
          restoreError
        ) {
          console.warn(
            "[AIFT Media Library] A chunk upload session could not be restored:",
            restoreError
          );
        }
      }
    }

    getSnapshot() {
      const sessions =
        this.getSessions();

      return {
        version:
          CHUNKED_UPLOAD_VERSION,

        totalSessions:
          sessions.length,

        activeSessions:
          sessions.filter(
            session =>
              session.state ===
              CHUNK_UPLOAD_STATE.UPLOADING
          ).length,

        pausedSessions:
          sessions.filter(
            session =>
              session.state ===
              CHUNK_UPLOAD_STATE.PAUSED
          ).length,

        completedSessions:
          sessions.filter(
            session =>
              session.state ===
              CHUNK_UPLOAD_STATE.COMPLETED
          ).length,

        failedSessions:
          sessions.filter(
            session =>
              session.state ===
              CHUNK_UPLOAD_STATE.FAILED
          ).length,

        sessions:
          sessions.map(
            session =>
              session.toJSON()
          )
      };
    }

    emit(
      eventName,
      payload = {}
    ) {
      if (
        this.eventBus &&
        resolvedIsFunction(
          this.eventBus.emit
        )
      ) {
        this.eventBus.emit(
          eventName,
          {
            ...payload,

            timestamp:
              nowIsoString()
          }
        );
      }
    }

    destroy() {
      if (
        this.destroyed
      ) {
        return;
      }

      if (
        this.sessionPersistTimer
      ) {
        windowObject.clearTimeout(
          this.sessionPersistTimer
        );

        this.sessionPersistTimer =
          null;
      }

      for (
        const session
        of this.sessions.values()
      ) {
        for (
          const chunk
          of session.activeChunks
        ) {
          if (
            chunk.controller
          ) {
            chunk.controller.abort();
          }
        }

        session.setState(
          CHUNK_UPLOAD_STATE.DESTROYED
        );
      }

      this.persistSessions();

      this.sessions.clear();

      this.activeRunPromises.clear();

      this.destroyed =
        true;
    }
  }

  /* =========================================================
     ENGINE CONFIGURATION
  ========================================================= */

  function resolveChunkedUploadConfiguration() {
    const rootConfiguration =
      mediaLibrary.configuration ||
      application.configuration ||
      {};

    const uploadConfiguration =
      resolvedIsObject(
        rootConfiguration.upload
      )
        ? rootConfiguration.upload
        : {};

    const chunkConfiguration =
      resolvedIsObject(
        uploadConfiguration.chunked
      )
        ? uploadConfiguration.chunked
        : {};

    return {
      chunkSize:
        normalizeChunkSize(
          chunkConfiguration.chunkSize ||
          DEFAULT_CHUNK_SIZE_BYTES
        ),

      maximumParallelChunks:
        Math.max(
          1,
          resolvedSafeInteger(
            chunkConfiguration.maximumParallelChunks,
            DEFAULT_MAXIMUM_PARALLEL_CHUNKS
          )
        ),

      maximumChunkAttempts:
        Math.max(
          1,
          resolvedSafeInteger(
            chunkConfiguration.maximumChunkAttempts,
            DEFAULT_MAXIMUM_CHUNK_ATTEMPTS
          )
        ),

      chunkUploadTimeoutMilliseconds:
        Math.max(
          1000,
          resolvedSafeInteger(
            chunkConfiguration.chunkUploadTimeoutMilliseconds,
            rootConfiguration.uploadTimeoutMilliseconds ||
            DEFAULT_CHUNK_UPLOAD_TIMEOUT_MS
          )
        ),

      initializationTimeoutMilliseconds:
        Math.max(
          1000,
          resolvedSafeInteger(
            chunkConfiguration.initializationTimeoutMilliseconds,
            DEFAULT_UPLOAD_INITIALIZATION_TIMEOUT_MS
          )
        ),

      finalizationTimeoutMilliseconds:
        Math.max(
          1000,
          resolvedSafeInteger(
            chunkConfiguration.finalizationTimeoutMilliseconds,
            DEFAULT_UPLOAD_FINALIZATION_TIMEOUT_MS
          )
        ),

      retryBaseDelayMilliseconds:
        Math.max(
          100,
          resolvedSafeInteger(
            chunkConfiguration.retryBaseDelayMilliseconds,
            DEFAULT_RETRY_BASE_DELAY_MS
          )
        ),

      retryMaximumDelayMilliseconds:
        Math.max(
          DEFAULT_RETRY_BASE_DELAY_MS,
          resolvedSafeInteger(
            chunkConfiguration.retryMaximumDelayMilliseconds,
            DEFAULT_RETRY_MAX_DELAY_MS
          )
        ),

      retryJitterRatio:
        resolvedClampNumber(
          resolvedSafeNumber(
            chunkConfiguration.retryJitterRatio,
            DEFAULT_RETRY_JITTER_RATIO
          ),
          0,
          1
        ),

      progressThrottleMilliseconds:
        Math.max(
          0,
          resolvedSafeInteger(
            chunkConfiguration.progressThrottleMilliseconds,
            DEFAULT_PROGRESS_THROTTLE_MS
          )
        ),

      sessionStorageKey:
        resolvedSafeString(
          chunkConfiguration.sessionStorageKey,
          CHUNK_SESSION_STORAGE_KEY
        ),

      sessionPersistDebounceMilliseconds:
        Math.max(
          0,
          resolvedSafeInteger(
            chunkConfiguration.sessionPersistDebounceMilliseconds,
            DEFAULT_SESSION_PERSIST_DEBOUNCE_MS
          )
        ),

      staleSessionAgeMilliseconds:
        Math.max(
          60000,
          resolvedSafeInteger(
            chunkConfiguration.staleSessionAgeMilliseconds,
            DEFAULT_STALE_SESSION_AGE_MS
          )
        ),

      initializeEndpoint:
        resolvedSafeString(
          chunkConfiguration.initializeEndpoint
        ),

      uploadChunkEndpoint:
        resolvedSafeString(
          chunkConfiguration.uploadChunkEndpoint
        ),

      finalizeEndpoint:
        resolvedSafeString(
          chunkConfiguration.finalizeEndpoint
        ),

      cancelEndpoint:
        resolvedSafeString(
          chunkConfiguration.cancelEndpoint
        ),

      statusEndpoint:
        resolvedSafeString(
          chunkConfiguration.statusEndpoint
        )
    };
  }

  const chunkedUploadConfiguration =
    resolveChunkedUploadConfiguration();

  const chunkedUploadTransport =
    new XMLHttpRequestChunkTransport({
      timeoutMilliseconds:
        chunkedUploadConfiguration
          .chunkUploadTimeoutMilliseconds
    });

  const chunkedUploadEngine =
    new ChunkedUploadEngine({
      ...chunkedUploadConfiguration,

      queue:
        uploadQueue,

      api,

      eventBus,

      notifications,

      transport:
        chunkedUploadTransport
    });

  /* =========================================================
     APPLICATION CLEANUP INTEGRATION
  ========================================================= */

  if (
    application &&
    resolvedIsFunction(
      application.registerCleanup
    )
  ) {
    application.registerCleanup(
      () => {
        chunkedUploadEngine.destroy();
      }
    );
  }

  /* =========================================================
     PUBLIC CHUNKED UPLOAD INTERFACE
  ========================================================= */

  const chunkedUploadPublicInterface = {
    version:
      CHUNKED_UPLOAD_VERSION,

    states:
      CHUNK_UPLOAD_STATE,

    chunkStatuses:
      CHUNK_STATUS,

    errorCodes:
      CHUNKED_UPLOAD_ERROR_CODE,

    events:
      CHUNKED_UPLOAD_EVENTS,

    configuration:
      chunkedUploadConfiguration,

    engine:
      chunkedUploadEngine,

    transport:
      chunkedUploadTransport,

    classes: {
      UploadChunkDescriptor,

      ChunkedUploadSession,

      XMLHttpRequestChunkTransport,

      ChunkedUploadEngine
    },

    createSession(
      itemOrId,
      options
    ) {
      return chunkedUploadEngine
        .createSession(
          itemOrId,
          options
        );
    },

    initializeSession(
      sessionOrId,
      options
    ) {
      return chunkedUploadEngine
        .initializeSession(
          sessionOrId,
          options
        );
    },

    start(
      itemOrSessionId,
      options
    ) {
      return chunkedUploadEngine
        .start(
          itemOrSessionId,
          options
        );
    },

    pause(
      sessionOrItemId
    ) {
      return chunkedUploadEngine
        .pause(
          sessionOrItemId
        );
    },

    resume(
      sessionOrItemId,
      options
    ) {
      return chunkedUploadEngine
        .resume(
          sessionOrItemId,
          options
        );
    },

    cancel(
      sessionOrItemId,
      options
    ) {
      return chunkedUploadEngine
        .cancel(
          sessionOrItemId,
          options
        );
    },

    finalize(
      sessionOrId,
      options
    ) {
      return chunkedUploadEngine
        .finalizeSession(
          sessionOrId,
          options
        );
    },

    getSession(
      sessionId
    ) {
      return chunkedUploadEngine
        .getSession(
          sessionId
        );
    },

    getSessionByQueueItem(
      queueItemId
    ) {
      return chunkedUploadEngine
        .getSessionByQueueItem(
          queueItemId
        );
    },

    getSessions(
      options
    ) {
      return chunkedUploadEngine
        .getSessions(
          options
        );
    },

    replaceSessionFile(
      sessionOrItemId,
      file
    ) {
      return chunkedUploadEngine
        .replaceSessionFile(
          sessionOrItemId,
          file
        );
    },

    removeSession(
      sessionId,
      options
    ) {
      return chunkedUploadEngine
        .removeSession(
          sessionId,
          options
        );
    },

    getSnapshot() {
      return chunkedUploadEngine
        .getSnapshot();
    },

    persist() {
      return chunkedUploadEngine
        .persistSessions();
    },

    destroy() {
      return chunkedUploadEngine
        .destroy();
    }
  };

  /* =========================================================
     CORE INTERFACE EXTENSION
  ========================================================= */

  uploads.chunked =
    chunkedUploadPublicInterface;

  mediaLibrary.chunkedUploads =
    chunkedUploadPublicInterface;

  mediaLibrary.chunkedUploadEngine =
    chunkedUploadEngine;

  mediaLibrary.chunkedUploadEvents =
    CHUNKED_UPLOAD_EVENTS;

  mediaLibrary.chunkedUploadStates =
    CHUNK_UPLOAD_STATE;

  mediaLibrary.chunkStatuses =
    CHUNK_STATUS;

  mediaLibrary.classes = {
    ...mediaLibrary.classes,

    UploadChunkDescriptor,

    ChunkedUploadSession,

    XMLHttpRequestChunkTransport,

    ChunkedUploadEngine
  };

  mediaLibrary.startChunkedUpload =
    function startChunkedUpload(
      itemOrSessionId,
      options
    ) {
      return chunkedUploadEngine
        .start(
          itemOrSessionId,
          options
        );
    };

  mediaLibrary.pauseChunkedUpload =
    function pauseChunkedUpload(
      sessionOrItemId
    ) {
      return chunkedUploadEngine
        .pause(
          sessionOrItemId
        );
    };

  mediaLibrary.resumeChunkedUpload =
    function resumeChunkedUpload(
      sessionOrItemId,
      options
    ) {
      return chunkedUploadEngine
        .resume(
          sessionOrItemId,
          options
        );
    };

  mediaLibrary.cancelChunkedUpload =
    function cancelChunkedUpload(
      sessionOrItemId,
      options
    ) {
      return chunkedUploadEngine
        .cancel(
          sessionOrItemId,
          options
        );
    };

  mediaLibrary.getChunkedUploadSession =
    function getChunkedUploadSession(
      sessionId
    ) {
      return chunkedUploadEngine
        .getSession(
          sessionId
        );
    };

  mediaLibrary.getChunkedUploadSessions =
    function getChunkedUploadSessions(
      options
    ) {
      return chunkedUploadEngine
        .getSessions(
          options
        );
    };

  mediaLibrary.__chunkedUploadInitialized =
    true;

  /* =========================================================
     ENGINE READY EVENT
  ========================================================= */

  eventBus.emit(
    CHUNKED_UPLOAD_EVENTS.ENGINE_INITIALIZED,
    {
      version:
        CHUNKED_UPLOAD_VERSION,

      configuration:
        resolvedDeepClone(
          chunkedUploadConfiguration
        ),

      snapshot:
        chunkedUploadEngine
          .getSnapshot(),

      timestamp:
        nowIsoString()
    }
  );
})(
  window,
  document
);
"use strict";

/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2C OF 15
   UPLOAD MANAGER
========================================================= */

(function initializeAiftUploadManager(
  windowObject,
  documentObject
) {
  if (
    !windowObject ||
    !documentObject
  ) {
    return;
  }

  const mediaLibrary =
    windowObject.AIFTMediaLibrary;

  if (
    !mediaLibrary ||
    !mediaLibrary.__coreInitialized
  ) {
    console.error(
      "[AIFT Media Library] Part 2C requires Part 1 to be loaded first."
    );

    return;
  }

  if (
    !mediaLibrary.__uploadQueueInitialized ||
    !mediaLibrary.uploads
  ) {
    console.error(
      "[AIFT Media Library] Part 2C requires Part 2A to be loaded first."
    );

    return;
  }

  if (
    !mediaLibrary.__chunkedUploadInitialized ||
    !mediaLibrary.chunkedUploads
  ) {
    console.error(
      "[AIFT Media Library] Part 2C requires Part 2B to be loaded first."
    );

    return;
  }

  if (
    mediaLibrary.__uploadManagerInitialized
  ) {
    console.warn(
      "[AIFT Media Library] Upload manager has already been initialized."
    );

    return;
  }

  /* =========================================================
     CORE REFERENCES
  ========================================================= */

  const application =
    mediaLibrary.application;

  const api =
    mediaLibrary.api;

  const store =
    mediaLibrary.store;

  const eventBus =
    mediaLibrary.eventBus;

  const notifications =
    mediaLibrary.notifications;

  const uploads =
    mediaLibrary.uploads;

  const uploadQueue =
    uploads.queue;

  const uploadStatuses =
    uploads.statuses;

  const uploadSources =
    uploads.sources;

  const uploadEvents =
    uploads.events;

  const chunkedUploads =
    mediaLibrary.chunkedUploads;

  const chunkedUploadEngine =
    chunkedUploads.engine;

  const chunkedUploadStates =
    chunkedUploads.states;

  const chunkedUploadEvents =
    chunkedUploads.events;

  const utilities =
    mediaLibrary.utilities ||
    {};

  const {
    isObject,
    isFunction,
    safeString,
    safeNumber,
    safeInteger,
    clampNumber,
    normalizeArray,
    createId,
    delay,
    debounce,
    normalizeError,
    deepClone,
    formatFileSize
  } = utilities;

  /* =========================================================
     MANAGER CONSTANTS
  ========================================================= */

  const UPLOAD_MANAGER_VERSION =
    "1.0.0";

  const DEFAULT_MAXIMUM_PARALLEL_UPLOADS =
    2;

  const DEFAULT_SMALL_FILE_THRESHOLD_BYTES =
    16 * 1024 * 1024;

  const DEFAULT_DIRECT_UPLOAD_TIMEOUT_MS =
    180000;

  const DEFAULT_PROCESS_INTERVAL_MS =
    100;

  const DEFAULT_NETWORK_RETRY_DELAY_MS =
    3000;

  const DEFAULT_MAXIMUM_FILE_ATTEMPTS =
    3;

  const DEFAULT_AUTO_START =
    true;

  const DEFAULT_AUTO_RESUME_ONLINE =
    true;

  const DEFAULT_AUTO_PAUSE_OFFLINE =
    true;

  const DEFAULT_REMOVE_COMPLETED_AFTER_MS =
    0;

  const DEFAULT_COMPLETED_RETENTION_COUNT =
    50;

  const DEFAULT_PROGRESS_THROTTLE_MS =
    100;

  const DEFAULT_DIRECT_UPLOAD_ENDPOINT =
    "/media/upload";

  const UPLOAD_STRATEGY =
    Object.freeze({
      AUTO:
        "auto",

      DIRECT:
        "direct",

      CHUNKED:
        "chunked"
    });

  const UPLOAD_MANAGER_STATE =
    Object.freeze({
      IDLE:
        "idle",

      RUNNING:
        "running",

      PAUSED:
        "paused",

      OFFLINE:
        "offline",

      STOPPING:
        "stopping",

      STOPPED:
        "stopped",

      DESTROYED:
        "destroyed"
    });

  const UPLOAD_MANAGER_ERROR_CODE =
    Object.freeze({
      INVALID_ITEM:
        "UPLOAD_MANAGER_INVALID_ITEM",

      FILE_UNAVAILABLE:
        "UPLOAD_MANAGER_FILE_UNAVAILABLE",

      DIRECT_UPLOAD_FAILED:
        "UPLOAD_MANAGER_DIRECT_UPLOAD_FAILED",

      DIRECT_UPLOAD_TIMEOUT:
        "UPLOAD_MANAGER_DIRECT_UPLOAD_TIMEOUT",

      DIRECT_UPLOAD_ABORTED:
        "UPLOAD_MANAGER_DIRECT_UPLOAD_ABORTED",

      PROCESSING_FAILED:
        "UPLOAD_MANAGER_PROCESSING_FAILED",

      OFFLINE:
        "UPLOAD_MANAGER_OFFLINE",

      MANAGER_PAUSED:
        "UPLOAD_MANAGER_PAUSED",

      MANAGER_STOPPED:
        "UPLOAD_MANAGER_STOPPED",

      UNSUPPORTED_STRATEGY:
        "UPLOAD_MANAGER_UNSUPPORTED_STRATEGY",

      UNKNOWN:
        "UPLOAD_MANAGER_UNKNOWN"
    });

  const UPLOAD_MANAGER_EVENTS =
    Object.freeze({
      INITIALIZED:
        "media-library:upload-manager-initialized",

      STATE_CHANGED:
        "media-library:upload-manager-state-changed",

      STARTED:
        "media-library:upload-manager-started",

      STOPPED:
        "media-library:upload-manager-stopped",

      PAUSED:
        "media-library:upload-manager-paused",

      RESUMED:
        "media-library:upload-manager-resumed",

      OFFLINE:
        "media-library:upload-manager-offline",

      ONLINE:
        "media-library:upload-manager-online",

      PROCESSING_STARTED:
        "media-library:upload-manager-processing-started",

      PROCESSING_FINISHED:
        "media-library:upload-manager-processing-finished",

      ITEM_SCHEDULED:
        "media-library:upload-manager-item-scheduled",

      ITEM_STARTED:
        "media-library:upload-manager-item-started",

      ITEM_PAUSED:
        "media-library:upload-manager-item-paused",

      ITEM_RESUMED:
        "media-library:upload-manager-item-resumed",

      ITEM_RETRYING:
        "media-library:upload-manager-item-retrying",

      ITEM_COMPLETED:
        "media-library:upload-manager-item-completed",

      ITEM_FAILED:
        "media-library:upload-manager-item-failed",

      ITEM_CANCELED:
        "media-library:upload-manager-item-canceled",

      DIRECT_UPLOAD_STARTED:
        "media-library:direct-upload-started",

      DIRECT_UPLOAD_PROGRESS:
        "media-library:direct-upload-progress",

      DIRECT_UPLOAD_COMPLETED:
        "media-library:direct-upload-completed",

      DIRECT_UPLOAD_FAILED:
        "media-library:direct-upload-failed",

      QUEUE_DRAINED:
        "media-library:upload-manager-queue-drained",

      CLEANUP_COMPLETED:
        "media-library:upload-manager-cleanup-completed"
    });

  /* =========================================================
     UTILITY FALLBACKS
  ========================================================= */

  function localIsObject(
    value
  ) {
    return (
      value !== null &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  }

  function localIsFunction(
    value
  ) {
    return typeof value ===
      "function";
  }

  function localSafeString(
    value,
    fallback = ""
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    const normalizedValue =
      String(value).trim();

    return normalizedValue ||
      fallback;
  }

  function localSafeNumber(
    value,
    fallback = 0
  ) {
    const numericValue =
      Number(value);

    return Number.isFinite(
      numericValue
    )
      ? numericValue
      : fallback;
  }

  function localSafeInteger(
    value,
    fallback = 0
  ) {
    return Math.trunc(
      localSafeNumber(
        value,
        fallback
      )
    );
  }

  function localClampNumber(
    value,
    minimum,
    maximum
  ) {
    return Math.min(
      maximum,
      Math.max(
        minimum,
        localSafeNumber(
          value,
          minimum
        )
      )
    );
  }

  function localNormalizeArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    return [value];
  }

  function localCreateId(
    prefix =
      "id"
  ) {
    return [
      prefix,
      Date.now()
        .toString(36),
      Math.random()
        .toString(36)
        .slice(
          2,
          12
        )
    ].join("-");
  }

  function localDelay(
    milliseconds
  ) {
    return new Promise(
      resolve => {
        windowObject.setTimeout(
          resolve,
          Math.max(
            0,
            localSafeInteger(
              milliseconds,
              0
            )
          )
        );
      }
    );
  }

  function localDebounce(
    callback,
    delayMilliseconds =
      0
  ) {
    let timeoutId =
      null;

    return function debouncedFunction(
      ...argumentsList
    ) {
      if (
        timeoutId
      ) {
        windowObject.clearTimeout(
          timeoutId
        );
      }

      timeoutId =
        windowObject.setTimeout(
          () => {
            timeoutId =
              null;

            callback.apply(
              this,
              argumentsList
            );
          },
          delayMilliseconds
        );
    };
  }

  function localNormalizeError(
    error,
    fallbackMessage =
      "An unexpected upload manager error occurred."
  ) {
    if (
      error instanceof Error
    ) {
      return {
        name:
          error.name ||
          "Error",

        message:
          error.message ||
          fallbackMessage,

        code:
          error.code ||
          UPLOAD_MANAGER_ERROR_CODE.UNKNOWN,

        stack:
          error.stack ||
          "",

        details:
          error.details ||
          null,

        retryable:
          Boolean(
            error.retryable
          )
      };
    }

    if (
      localIsObject(
        error
      )
    ) {
      return {
        name:
          localSafeString(
            error.name,
            "Error"
          ),

        message:
          localSafeString(
            error.message,
            fallbackMessage
          ),

        code:
          localSafeString(
            error.code,
            UPLOAD_MANAGER_ERROR_CODE.UNKNOWN
          ),

        stack:
          localSafeString(
            error.stack
          ),

        details:
          error.details ||
          null,

        retryable:
          Boolean(
            error.retryable
          )
      };
    }

    return {
      name:
        "Error",

      message:
        localSafeString(
          error,
          fallbackMessage
        ),

      code:
        UPLOAD_MANAGER_ERROR_CODE.UNKNOWN,

      stack:
        "",

      details:
        null,

      retryable:
        false
    };
  }

  function localDeepClone(
    value
  ) {
    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (
        cloneError
      ) {
        void cloneError;
      }
    }

    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  }

  const resolvedIsObject =
    isObject ||
    localIsObject;

  const resolvedIsFunction =
    isFunction ||
    localIsFunction;

  const resolvedSafeString =
    safeString ||
    localSafeString;

  const resolvedSafeNumber =
    safeNumber ||
    localSafeNumber;

  const resolvedSafeInteger =
    safeInteger ||
    localSafeInteger;

  const resolvedClampNumber =
    clampNumber ||
    localClampNumber;

  const resolvedNormalizeArray =
    normalizeArray ||
    localNormalizeArray;

  const resolvedCreateId =
    createId ||
    localCreateId;

  const resolvedDelay =
    delay ||
    localDelay;

  const resolvedDebounce =
    debounce ||
    localDebounce;

  const resolvedNormalizeError =
    normalizeError ||
    localNormalizeError;

  const resolvedDeepClone =
    deepClone ||
    localDeepClone;

  /* =========================================================
     GENERAL HELPERS
  ========================================================= */

  function nowIsoString() {
    return new Date()
      .toISOString();
  }

  function normalizeUploadStrategy(
    value,
    fallback =
      UPLOAD_STRATEGY.AUTO
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        fallback
      ).toLowerCase();

    if (
      Object.values(
        UPLOAD_STRATEGY
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return fallback;
  }

  function normalizeManagerState(
    value,
    fallback =
      UPLOAD_MANAGER_STATE.IDLE
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        fallback
      ).toLowerCase();

    if (
      Object.values(
        UPLOAD_MANAGER_STATE
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return fallback;
  }

  function normalizeByteCount(
    value
  ) {
    return Math.max(
      0,
      resolvedSafeInteger(
        value,
        0
      )
    );
  }

  function createUploadManagerError(
    message,
    options = {}
  ) {
    const managerError =
      new Error(
        resolvedSafeString(
          message,
          "An upload manager error occurred."
        )
      );

    managerError.name =
      "UploadManagerError";

    managerError.code =
      resolvedSafeString(
        options.code,
        UPLOAD_MANAGER_ERROR_CODE.UNKNOWN
      );

    managerError.details =
      options.details ||
      null;

    managerError.retryable =
      Boolean(
        options.retryable
      );

    managerError.status =
      options.status ||
      null;

    managerError.cause =
      options.cause ||
      null;

    return managerError;
  }

  function isAbortError(
    error
  ) {
    return (
      error?.name ===
        "AbortError" ||
      error?.code ===
        UPLOAD_MANAGER_ERROR_CODE.DIRECT_UPLOAD_ABORTED ||
      error?.code ===
        "REQUEST_ABORTED" ||
      error?.code ===
        "CHUNK_UPLOAD_ABORTED"
    );
  }

  function isNetworkError(
    error
  ) {
    const errorCode =
      resolvedSafeString(
        error?.code
      );

    return (
      errorCode.includes(
        "NETWORK"
      ) ||
      error?.status ===
        0 ||
      (
        !windowObject.navigator
          .onLine
      )
    );
  }

  function isRetryableError(
    error
  ) {
    if (
      error?.retryable ===
      true
    ) {
      return true;
    }

    if (
      isAbortError(
        error
      )
    ) {
      return false;
    }

    const status =
      resolvedSafeInteger(
        error?.status,
        0
      );

    return (
      isNetworkError(
        error
      ) ||
      status ===
        408 ||
      status ===
        409 ||
      status ===
        425 ||
      status ===
        429 ||
      status >=
        500
    );
  }

  function buildAbsoluteApiUrl(
    path
  ) {
    const normalizedPath =
      resolvedSafeString(
        path
      );

    if (
      /^https?:\/\//i.test(
        normalizedPath
      )
    ) {
      return normalizedPath;
    }

    const baseUrl =
      resolvedSafeString(
        mediaLibrary
          .configuration
          ?.apiBaseUrl ||
        application
          ?.configuration
          ?.apiBaseUrl
      ).replace(
        /\/+$/,
        ""
      );

    return [
      baseUrl,
      normalizedPath.startsWith(
        "/"
      )
        ? normalizedPath
        : `/${normalizedPath}`
    ].join("");
  }

  function resolveAuthenticationToken() {
    const authenticationManager =
      mediaLibrary.authentication ||
      application
        ?.authenticationManager;

    if (
      authenticationManager &&
      resolvedIsFunction(
        authenticationManager.getToken
      )
    ) {
      return resolvedSafeString(
        authenticationManager
          .getToken()
      );
    }

    if (
      authenticationManager &&
      resolvedIsFunction(
        authenticationManager.resolveToken
      )
    ) {
      return resolvedSafeString(
        authenticationManager
          .resolveToken()
      );
    }

    return "";
  }

  function normalizeDirectUploadResponse(
    responseBody
  ) {
    if (
      !responseBody
    ) {
      return {};
    }

    if (
      resolvedIsObject(
        responseBody.data
      )
    ) {
      return responseBody.data;
    }

    if (
      resolvedIsObject(
        responseBody.result
      )
    ) {
      return responseBody.result;
    }

    if (
      resolvedIsObject(
        responseBody.media
      )
    ) {
      return responseBody.media;
    }

    if (
      resolvedIsObject(
        responseBody
      )
    ) {
      return responseBody;
    }

    return {};
  }

  function createFormDataForUpload(
    item,
    options = {}
  ) {
    const formData =
      new FormData();

    formData.append(
      resolvedSafeString(
        options.fileFieldName,
        "file"
      ),
      item.file,
      item.name
    );

    if (
      item.classId
    ) {
      formData.append(
        "classId",
        item.classId
      );
    }

    if (
      item.folderId
    ) {
      formData.append(
        "folderId",
        item.folderId
      );
    }

    if (
      item.fingerprint
    ) {
      formData.append(
        "fingerprint",
        item.fingerprint
      );
    }

    if (
      item.basicFingerprint
    ) {
      formData.append(
        "basicFingerprint",
        item.basicFingerprint
      );
    }

    if (
      item.mediaType
    ) {
      formData.append(
        "mediaType",
        item.mediaType
      );
    }

    if (
      item.source
    ) {
      formData.append(
        "source",
        item.source
      );
    }

    if (
      Array.isArray(
        item.tags
      ) &&
      item.tags.length
    ) {
      formData.append(
        "tags",
        JSON.stringify(
          item.tags
        )
      );
    }

    if (
      item.metadata &&
      resolvedIsObject(
        item.metadata
      )
    ) {
      formData.append(
        "metadata",
        JSON.stringify(
          item.metadata
        )
      );
    }

    return formData;
  }

  /* =========================================================
     DIRECT UPLOAD TRANSPORT
  ========================================================= */

  class DirectUploadTransport {
    constructor(
      options = {}
    ) {
      this.endpoint =
        resolvedSafeString(
          options.endpoint,
          DEFAULT_DIRECT_UPLOAD_ENDPOINT
        );

      this.timeoutMilliseconds =
        Math.max(
          1000,
          resolvedSafeInteger(
            options.timeoutMilliseconds,
            DEFAULT_DIRECT_UPLOAD_TIMEOUT_MS
          )
        );

      this.withCredentials =
        options.withCredentials ===
        true;

      this.fileFieldName =
        resolvedSafeString(
          options.fileFieldName,
          "file"
        );
    }

    upload(
      item,
      options = {}
    ) {
      return new Promise(
        (
          resolve,
          reject
        ) => {
          if (
            !item ||
            !item.file
          ) {
            reject(
              createUploadManagerError(
                "The selected upload file is unavailable.",
                {
                  code:
                    UPLOAD_MANAGER_ERROR_CODE.FILE_UNAVAILABLE
                }
              )
            );

            return;
          }

          const endpoint =
            resolvedSafeString(
              options.endpoint,
              this.endpoint
            );

          const uploadUrl =
            buildAbsoluteApiUrl(
              endpoint
            );

          const xhr =
            new XMLHttpRequest();

          const controller =
            options.controller ||
            new AbortController();

          let settled =
            false;

          const settleOnce =
            callback => {
              if (
                settled
              ) {
                return;
              }

              settled =
                true;

              controller.signal
                .removeEventListener(
                  "abort",
                  handleAbort
                );

              callback();
            };

          const handleAbort =
            () => {
              if (
                xhr.readyState !==
                  XMLHttpRequest.DONE
              ) {
                xhr.abort();
              }

              settleOnce(
                () => {
                  reject(
                    createUploadManagerError(
                      "The direct upload was aborted.",
                      {
                        code:
                          UPLOAD_MANAGER_ERROR_CODE.DIRECT_UPLOAD_ABORTED
                      }
                    )
                  );
                }
              );
            };

          controller.signal
            .addEventListener(
              "abort",
              handleAbort,
              {
                once:
                  true
              }
            );

          xhr.open(
            "POST",
            uploadUrl,
            true
          );

          xhr.timeout =
            Math.max(
              1000,
              resolvedSafeInteger(
                options.timeoutMilliseconds,
                this.timeoutMilliseconds
              )
            );

          xhr.withCredentials =
            options.withCredentials ===
              true ||
            this.withCredentials;

          const token =
            resolveAuthenticationToken();

          if (
            token
          ) {
            xhr.setRequestHeader(
              "Authorization",
              `Bearer ${token}`
            );
          }

          const customHeaders =
            resolvedIsObject(
              options.headers
            )
              ? options.headers
              : {};

          Object.entries(
            customHeaders
          ).forEach(
            (
              [
                headerName,
                headerValue
              ]
            ) => {
              const normalizedHeaderName =
                resolvedSafeString(
                  headerName
                );

              if (
                !normalizedHeaderName ||
                headerValue ===
                  undefined ||
                headerValue ===
                  null
              ) {
                return;
              }

              xhr.setRequestHeader(
                normalizedHeaderName,
                String(
                  headerValue
                )
              );
            }
          );

          xhr.upload.onprogress =
            progressEvent => {
              if (
                !progressEvent
                  .lengthComputable
              ) {
                return;
              }

              if (
                resolvedIsFunction(
                  options.onProgress
                )
              ) {
                options.onProgress({
                  loaded:
                    progressEvent.loaded,

                  total:
                    progressEvent.total,

                  progress:
                    resolvedClampNumber(
                      (
                        progressEvent.loaded /
                        progressEvent.total
                      ) *
                      100,
                      0,
                      100
                    )
                });
              }
            };

          xhr.onload =
            () => {
              settleOnce(
                () => {
                  const responseText =
                    resolvedSafeString(
                      xhr.responseText
                    );

                  let responseBody =
                    responseText;

                  if (
                    responseText
                  ) {
                    try {
                      responseBody =
                        JSON.parse(
                          responseText
                        );
                    } catch (
                      parseError
                    ) {
                      void parseError;
                    }
                  }

                  if (
                    xhr.status >=
                      200 &&
                    xhr.status <
                      300
                  ) {
                    resolve({
                      status:
                        xhr.status,

                      body:
                        normalizeDirectUploadResponse(
                          responseBody
                        ),

                      headers:
                        xhr
                          .getAllResponseHeaders()
                    });

                    return;
                  }

                  reject(
                    createUploadManagerError(
                      resolvedSafeString(
                        responseBody?.message ||
                        responseBody?.error,
                        `Direct upload failed with status ${xhr.status}.`
                      ),
                      {
                        code:
                          UPLOAD_MANAGER_ERROR_CODE.DIRECT_UPLOAD_FAILED,

                        status:
                          xhr.status,

                        retryable:
                          (
                            xhr.status ===
                              408 ||
                            xhr.status ===
                              409 ||
                            xhr.status ===
                              425 ||
                            xhr.status ===
                              429 ||
                            xhr.status >=
                              500
                          ),

                        details: {
                          response:
                            responseBody
                        }
                      }
                    )
                  );
                }
              );
            };

          xhr.onerror =
            () => {
              settleOnce(
                () => {
                  reject(
                    createUploadManagerError(
                      "A network error interrupted the direct upload.",
                      {
                        code:
                          UPLOAD_MANAGER_ERROR_CODE.DIRECT_UPLOAD_FAILED,

                        retryable:
                          true
                      }
                    )
                  );
                }
              );
            };

          xhr.ontimeout =
            () => {
              settleOnce(
                () => {
                  reject(
                    createUploadManagerError(
                      "The direct upload timed out.",
                      {
                        code:
                          UPLOAD_MANAGER_ERROR_CODE.DIRECT_UPLOAD_TIMEOUT,

                        retryable:
                          true
                      }
                    )
                  );
                }
              );
            };

          xhr.onabort =
            () => {
              settleOnce(
                () => {
                  reject(
                    createUploadManagerError(
                      "The direct upload was aborted.",
                      {
                        code:
                          UPLOAD_MANAGER_ERROR_CODE.DIRECT_UPLOAD_ABORTED
                      }
                    )
                  );
                }
              );
            };

          if (
            resolvedIsFunction(
              options.onRequestCreated
            )
          ) {
            options.onRequestCreated(
              xhr,
              controller
            );
          }

          xhr.send(
            createFormDataForUpload(
              item,
              {
                fileFieldName:
                  options.fileFieldName ||
                  this.fileFieldName
              }
            )
          );
        }
      );
    }
  }

  /* =========================================================
     UPLOAD TASK
  ========================================================= */

  class ManagedUploadTask {
    constructor(
      queueItem,
      options = {}
    ) {
      if (
        !queueItem
      ) {
        throw createUploadManagerError(
          "A valid queue item is required to create an upload task.",
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.INVALID_ITEM
          }
        );
      }

      this.id =
        resolvedSafeString(
          options.id,
          resolvedCreateId(
            "managed-upload"
          )
        );

      this.queueItemId =
        resolvedSafeString(
          queueItem.id
        );

      this.strategy =
        normalizeUploadStrategy(
          options.strategy
        );

      this.resolvedStrategy =
        null;

      this.createdAt =
        nowIsoString();

      this.startedAt =
        null;

      this.completedAt =
        null;

      this.failedAt =
        null;

      this.pausedAt =
        null;

      this.canceledAt =
        null;

      this.updatedAt =
        this.createdAt;

      this.attempt =
        Math.max(
          0,
          resolvedSafeInteger(
            options.attempt,
            0
          )
        );

      this.maximumAttempts =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumAttempts,
            DEFAULT_MAXIMUM_FILE_ATTEMPTS
          )
        );

      this.running =
        false;

      this.paused =
        false;

      this.canceled =
        false;

      this.completed =
        false;

      this.failed =
        false;

      this.error =
        null;

      this.controller =
        null;

      this.request =
        null;

      this.promise =
        null;

      this.chunkSessionId =
        null;

      this.metadata =
        resolvedIsObject(
          options.metadata
        )
          ? resolvedDeepClone(
              options.metadata
            )
          : {};
    }

    canRetry() {
      return (
        this.failed &&
        this.attempt <
          this.maximumAttempts
      );
    }

    markStarted(
      strategy
    ) {
      this.running =
        true;

      this.paused =
        false;

      this.canceled =
        false;

      this.failed =
        false;

      this.completed =
        false;

      this.resolvedStrategy =
        normalizeUploadStrategy(
          strategy,
          UPLOAD_STRATEGY.DIRECT
        );

      this.attempt +=
        1;

      this.startedAt =
        this.startedAt ||
        nowIsoString();

      this.updatedAt =
        nowIsoString();

      this.error =
        null;

      return this;
    }

    markPaused() {
      this.running =
        false;

      this.paused =
        true;

      this.pausedAt =
        nowIsoString();

      this.updatedAt =
        this.pausedAt;

      return this;
    }

    markCompleted() {
      this.running =
        false;

      this.paused =
        false;

      this.failed =
        false;

      this.canceled =
        false;

      this.completed =
        true;

      this.completedAt =
        nowIsoString();

      this.updatedAt =
        this.completedAt;

      this.error =
        null;

      return this;
    }

    markFailed(
      error
    ) {
      this.running =
        false;

      this.paused =
        false;

      this.failed =
        true;

      this.completed =
        false;

      this.error =
        resolvedNormalizeError(
          error
        );

      this.failedAt =
        nowIsoString();

      this.updatedAt =
        this.failedAt;

      return this;
    }

    markCanceled() {
      this.running =
        false;

      this.paused =
        false;

      this.failed =
        false;

      this.completed =
        false;

      this.canceled =
        true;

      this.canceledAt =
        nowIsoString();

      this.updatedAt =
        this.canceledAt;

      return this;
    }

    resetForRetry() {
      this.running =
        false;

      this.paused =
        false;

      this.failed =
        false;

      this.canceled =
        false;

      this.completed =
        false;

      this.error =
        null;

      this.controller =
        null;

      this.request =
        null;

      this.promise =
        null;

      this.updatedAt =
        nowIsoString();

      return this;
    }

    toJSON() {
      return {
        id:
          this.id,

        queueItemId:
          this.queueItemId,

        strategy:
          this.strategy,

        resolvedStrategy:
          this.resolvedStrategy,

        attempt:
          this.attempt,

        maximumAttempts:
          this.maximumAttempts,

        running:
          this.running,

        paused:
          this.paused,

        canceled:
          this.canceled,

        completed:
          this.completed,

        failed:
          this.failed,

        chunkSessionId:
          this.chunkSessionId,

        error:
          this.error
            ? resolvedDeepClone(
                this.error
              )
            : null,

        metadata:
          resolvedDeepClone(
            this.metadata
          ),

        createdAt:
          this.createdAt,

        startedAt:
          this.startedAt,

        completedAt:
          this.completedAt,

        failedAt:
          this.failedAt,

        pausedAt:
          this.pausedAt,

        canceledAt:
          this.canceledAt,

        updatedAt:
          this.updatedAt
      };
    }
  }

  /* =========================================================
     UPLOAD MANAGER
  ========================================================= */

  class UploadManager {
    constructor(
      options = {}
    ) {
      this.queue =
        options.queue ||
        uploadQueue;

      this.chunkedEngine =
        options.chunkedEngine ||
        chunkedUploadEngine;

      this.eventBus =
        options.eventBus ||
        eventBus;

      this.notifications =
        options.notifications ||
        notifications;

      this.directTransport =
        options.directTransport ||
        new DirectUploadTransport({
          endpoint:
            options.directUploadEndpoint,

          timeoutMilliseconds:
            options.directUploadTimeoutMilliseconds,

          fileFieldName:
            options.fileFieldName
        });

      this.maximumParallelUploads =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumParallelUploads,
            DEFAULT_MAXIMUM_PARALLEL_UPLOADS
          )
        );

      this.smallFileThresholdBytes =
        Math.max(
          1,
          normalizeByteCount(
            options.smallFileThresholdBytes ||
            DEFAULT_SMALL_FILE_THRESHOLD_BYTES
          )
        );

      this.directUploadTimeoutMilliseconds =
        Math.max(
          1000,
          resolvedSafeInteger(
            options.directUploadTimeoutMilliseconds,
            DEFAULT_DIRECT_UPLOAD_TIMEOUT_MS
          )
        );

      this.processIntervalMilliseconds =
        Math.max(
          25,
          resolvedSafeInteger(
            options.processIntervalMilliseconds,
            DEFAULT_PROCESS_INTERVAL_MS
          )
        );

      this.networkRetryDelayMilliseconds =
        Math.max(
          250,
          resolvedSafeInteger(
            options.networkRetryDelayMilliseconds,
            DEFAULT_NETWORK_RETRY_DELAY_MS
          )
        );

      this.maximumFileAttempts =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumFileAttempts,
            DEFAULT_MAXIMUM_FILE_ATTEMPTS
          )
        );

      this.autoStart =
        options.autoStart !==
        false;

      this.autoResumeOnline =
        options.autoResumeOnline !==
        false;

      this.autoPauseOffline =
        options.autoPauseOffline !==
        false;

      this.removeCompletedAfterMilliseconds =
        Math.max(
          0,
          resolvedSafeInteger(
            options.removeCompletedAfterMilliseconds,
            DEFAULT_REMOVE_COMPLETED_AFTER_MS
          )
        );

      this.completedRetentionCount =
        Math.max(
          0,
          resolvedSafeInteger(
            options.completedRetentionCount,
            DEFAULT_COMPLETED_RETENTION_COUNT
          )
        );

      this.progressThrottleMilliseconds =
        Math.max(
          0,
          resolvedSafeInteger(
            options.progressThrottleMilliseconds,
            DEFAULT_PROGRESS_THROTTLE_MS
          )
        );

      this.defaultStrategy =
        normalizeUploadStrategy(
          options.defaultStrategy,
          UPLOAD_STRATEGY.AUTO
        );

      this.state =
        windowObject.navigator
          .onLine
          ? UPLOAD_MANAGER_STATE.IDLE
          : UPLOAD_MANAGER_STATE.OFFLINE;

      this.tasks =
        new Map();

      this.activeTaskIds =
        new Set();

      this.processPromise =
        null;

      this.processTimer =
        null;

      this.destroyed =
        false;

      this.started =
        false;

      this.lastProcessAt =
        null;

      this.lastQueueDrainAt =
        null;

      this.queueUnsubscribe =
        null;

      this.cleanupTimers =
        new Map();

      this.boundHandleOnline =
        this.handleOnline
          .bind(this);

      this.boundHandleOffline =
        this.handleOffline
          .bind(this);

      this.boundHandleVisibilityChange =
        this.handleVisibilityChange
          .bind(this);

      this.scheduleProcess =
        resolvedDebounce(
          () => {
            this.process()
              .catch(
                processError => {
                  console.error(
                    "[AIFT Media Library] Upload manager processing failed:",
                    processError
                  );
                }
              );
          },
          this.processIntervalMilliseconds
        );

      this.bindEvents();

      this.synchronizeStore(
        "upload-manager-created"
      );

      if (
        this.autoStart
      ) {
        this.start();
      }
    }

    assertAvailable() {
      if (
        this.destroyed
      ) {
        throw createUploadManagerError(
          "The upload manager has been destroyed.",
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.UNKNOWN
          }
        );
      }
    }

    bindEvents() {
      windowObject.addEventListener(
        "online",
        this.boundHandleOnline
      );

      windowObject.addEventListener(
        "offline",
        this.boundHandleOffline
      );

      documentObject.addEventListener(
        "visibilitychange",
        this.boundHandleVisibilityChange
      );

      this.queueUnsubscribe =
        this.queue.subscribe(
          (
            snapshot,
            metadata
          ) => {
            this.handleQueueChange(
              snapshot,
              metadata
            );
          }
        );
    }

    handleVisibilityChange() {
      if (
        documentObject.visibilityState !==
        "visible"
      ) {
        return;
      }

      if (
        this.started &&
        this.state ===
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.scheduleProcess();
      }
    }

    handleQueueChange(
      snapshot,
      metadata = {}
    ) {
      void snapshot;

      const reason =
        resolvedSafeString(
          metadata.reason
        );

      if (
        [
          "upload-progress-changed",
          "upload-fingerprint-created"
        ].includes(
          reason
        )
      ) {
        return;
      }

      if (
        this.started &&
        this.state ===
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.scheduleProcess();
      }
    }

    handleOnline() {
      if (
        this.destroyed
      ) {
        return;
      }

      const previousState =
        this.state;

      this.state =
        this.started
          ? UPLOAD_MANAGER_STATE.RUNNING
          : UPLOAD_MANAGER_STATE.IDLE;

      this.emitStateChange(
        previousState,
        "browser-online"
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.ONLINE,
        {
          state:
            this.state
        }
      );

      if (
        this.autoResumeOnline &&
        this.started
      ) {
        this.resumeAll({
          onlyOfflinePaused:
            true
        });

        this.scheduleProcess();
      }
    }

    handleOffline() {
      if (
        this.destroyed
      ) {
        return;
      }

      const previousState =
        this.state;

      this.state =
        UPLOAD_MANAGER_STATE.OFFLINE;

      this.emitStateChange(
        previousState,
        "browser-offline"
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.OFFLINE,
        {
          activeTaskCount:
            this.activeTaskIds.size
        }
      );

      if (
        this.autoPauseOffline
      ) {
        this.pauseAll({
          reason:
            "offline",
          markOfflinePaused:
            true
        });
      }
    }

    start() {
      this.assertAvailable();

      if (
        this.started &&
        this.state ===
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        return this;
      }

      this.started =
        true;

      const previousState =
        this.state;

      this.state =
        windowObject.navigator
          .onLine
          ? UPLOAD_MANAGER_STATE.RUNNING
          : UPLOAD_MANAGER_STATE.OFFLINE;

      this.emitStateChange(
        previousState,
        "manager-started"
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.STARTED,
        {
          state:
            this.state
        }
      );

      if (
        this.state ===
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.scheduleProcess();
      }

      return this;
    }

    async stop(
      options = {}
    ) {
      this.assertAvailable();

      if (
        !this.started
      ) {
        return this;
      }

      const previousState =
        this.state;

      this.state =
        UPLOAD_MANAGER_STATE.STOPPING;

      this.emitStateChange(
        previousState,
        "manager-stopping"
      );

      if (
        options.pauseActive !==
        false
      ) {
        await this.pauseAll({
          reason:
            "manager-stopped"
        });
      }

      this.started =
        false;

      this.clearProcessTimer();

      const stoppingState =
        this.state;

      this.state =
        UPLOAD_MANAGER_STATE.STOPPED;

      this.emitStateChange(
        stoppingState,
        "manager-stopped"
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.STOPPED,
        {
          state:
            this.state
        }
      );

      return this;
    }

    pause() {
      this.assertAvailable();

      if (
        this.state ===
        UPLOAD_MANAGER_STATE.PAUSED
      ) {
        return this;
      }

      const previousState =
        this.state;

      this.state =
        UPLOAD_MANAGER_STATE.PAUSED;

      this.clearProcessTimer();

      this.emitStateChange(
        previousState,
        "manager-paused"
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.PAUSED,
        {
          state:
            this.state
        }
      );

      return this;
    }

    resume() {
      this.assertAvailable();

      if (
        !this.started
      ) {
        return this.start();
      }

      const previousState =
        this.state;

      this.state =
        windowObject.navigator
          .onLine
          ? UPLOAD_MANAGER_STATE.RUNNING
          : UPLOAD_MANAGER_STATE.OFFLINE;

      this.emitStateChange(
        previousState,
        "manager-resumed"
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.RESUMED,
        {
          state:
            this.state
        }
      );

      if (
        this.state ===
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.scheduleProcess();
      }

      return this;
    }

    clearProcessTimer() {
      if (
        this.processTimer
      ) {
        windowObject.clearTimeout(
          this.processTimer
        );

        this.processTimer =
          null;
      }
    }

    resolveStrategy(
      item,
      requestedStrategy =
        this.defaultStrategy
    ) {
      const strategy =
        normalizeUploadStrategy(
          requestedStrategy
        );

      if (
        strategy ===
        UPLOAD_STRATEGY.DIRECT ||
        strategy ===
        UPLOAD_STRATEGY.CHUNKED
      ) {
        return strategy;
      }

      if (
        strategy !==
        UPLOAD_STRATEGY.AUTO
      ) {
        throw createUploadManagerError(
          `Unsupported upload strategy "${strategy}".`,
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.UNSUPPORTED_STRATEGY
          }
        );
      }

      if (
        normalizeByteCount(
          item.size
        ) >
        this.smallFileThresholdBytes
      ) {
        return UPLOAD_STRATEGY.CHUNKED;
      }

      return UPLOAD_STRATEGY.DIRECT;
    }

    getTask(
      taskOrQueueItemId
    ) {
      const normalizedIdentifier =
        resolvedSafeString(
          taskOrQueueItemId
        );

      if (
        this.tasks.has(
          normalizedIdentifier
        )
      ) {
        return this.tasks.get(
          normalizedIdentifier
        );
      }

      for (
        const task
        of this.tasks.values()
      ) {
        if (
          task.queueItemId ===
          normalizedIdentifier
        ) {
          return task;
        }
      }

      return null;
    }

    getTasks(
      options = {}
    ) {
      let tasks =
        Array.from(
          this.tasks.values()
        );

      if (
        options.running !==
        undefined
      ) {
        tasks =
          tasks.filter(
            task =>
              task.running ===
              Boolean(
                options.running
              )
          );
      }

      if (
        options.completed !==
        undefined
      ) {
        tasks =
          tasks.filter(
            task =>
              task.completed ===
              Boolean(
                options.completed
              )
          );
      }

      if (
        options.failed !==
        undefined
      ) {
        tasks =
          tasks.filter(
            task =>
              task.failed ===
              Boolean(
                options.failed
              )
          );
      }

      return tasks.sort(
        (
          firstTask,
          secondTask
        ) =>
          (
            Date.parse(
              firstTask.createdAt
            ) ||
            0
          ) -
          (
            Date.parse(
              secondTask.createdAt
            ) ||
            0
          )
      );
    }

    createTask(
      item,
      options = {}
    ) {
      const existingTask =
        this.getTask(
          item.id
        );

      if (
        existingTask
      ) {
        if (
          options.strategy
        ) {
          existingTask.strategy =
            normalizeUploadStrategy(
              options.strategy
            );
        }

        return existingTask;
      }

      const task =
        new ManagedUploadTask(
          item,
          {
            strategy:
              options.strategy ||
              this.defaultStrategy,

            maximumAttempts:
              options.maximumAttempts ||
              this.maximumFileAttempts,

            metadata:
              options.metadata
          }
        );

      this.tasks.set(
        task.id,
        task
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.ITEM_SCHEDULED,
        {
          task:
            task.toJSON(),

          item:
            item.toPublicJSON
              ? item.toPublicJSON()
              : resolvedDeepClone(
                  item
                )
        }
      );

      return task;
    }

    getEligibleItems() {
      return this.queue.getItems({
        status: [
          uploadStatuses.QUEUED,
          uploadStatuses.WAITING,
          uploadStatuses.RETRYING
        ]
      }).filter(
        item =>
          item.file &&
          !this.activeTaskIds.has(
            this.getTask(
              item.id
            )?.id
          )
      );
    }

    async process() {
      this.assertAvailable();

      if (
        !this.started ||
        this.state !==
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        return this.getSnapshot();
      }

      if (
        !windowObject.navigator
          .onLine
      ) {
        this.handleOffline();

        return this.getSnapshot();
      }

      if (
        this.processPromise
      ) {
        return this.processPromise;
      }

      this.processPromise =
        this.performProcessing();

      try {
        return await this
          .processPromise;
      } finally {
        this.processPromise =
          null;
      }
    }

    async performProcessing() {
      this.lastProcessAt =
        nowIsoString();

      this.emit(
        UPLOAD_MANAGER_EVENTS.PROCESSING_STARTED,
        {
          activeTaskCount:
            this.activeTaskIds.size
        }
      );

      const availableSlots =
        Math.max(
          0,
          this.maximumParallelUploads -
          this.activeTaskIds.size
        );

      const eligibleItems =
        this.getEligibleItems()
          .slice(
            0,
            availableSlots
          );

      const taskPromises =
        eligibleItems.map(
          item =>
            this.startItem(
              item.id
            )
              .catch(
                taskError => {
                  console.error(
                    `[AIFT Media Library] Upload failed for "${item.name}":`,
                    taskError
                  );

                  return null;
                }
              )
        );

      if (
        taskPromises.length
      ) {
        await Promise.allSettled(
          taskPromises
        );
      }

      const remainingEligibleItems =
        this.getEligibleItems();

      if (
        remainingEligibleItems.length &&
        this.state ===
          UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.processTimer =
          windowObject.setTimeout(
            () => {
              this.processTimer =
                null;

              this.process()
                .catch(
                  processError => {
                    console.error(
                      "[AIFT Media Library] Upload manager loop failed:",
                      processError
                    );
                  }
                );
            },
            this.processIntervalMilliseconds
          );
      } else if (
        this.activeTaskIds.size ===
        0
      ) {
        this.lastQueueDrainAt =
          nowIsoString();

        this.emit(
          UPLOAD_MANAGER_EVENTS.QUEUE_DRAINED,
          {
            snapshot:
              this.getSnapshot()
          }
        );
      }

      this.cleanupCompletedTasks();

      this.emit(
        UPLOAD_MANAGER_EVENTS.PROCESSING_FINISHED,
        {
          activeTaskCount:
            this.activeTaskIds.size,

          remainingEligibleCount:
            remainingEligibleItems.length
        }
      );

      this.synchronizeStore(
        "upload-manager-processing-finished"
      );

      return this.getSnapshot();
    }

    async startItem(
      itemOrId,
      options = {}
    ) {
      this.assertAvailable();

      const item =
        resolvedIsObject(
          itemOrId
        )
          ? itemOrId
          : this.queue.get(
              itemOrId
            );

      if (
        !item
      ) {
        throw createUploadManagerError(
          "The upload queue item could not be found.",
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.INVALID_ITEM
          }
        );
      }

      if (
        !item.file
      ) {
        throw createUploadManagerError(
          `The original file for "${item.name}" is unavailable.`,
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.FILE_UNAVAILABLE,

            details: {
              itemId:
                item.id
            }
          }
        );
      }

      if (
        !windowObject.navigator
          .onLine
      ) {
        throw createUploadManagerError(
          "The upload cannot start while the browser is offline.",
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.OFFLINE,

            retryable:
              true
          }
        );
      }

      const task =
        this.createTask(
          item,
          options
        );

      if (
        task.promise
      ) {
        return task.promise;
      }

      const strategy =
        this.resolveStrategy(
          item,
          options.strategy ||
          task.strategy
        );

      task.markStarted(
        strategy
      );

      this.activeTaskIds.add(
        task.id
      );

      this.queue.setStatus(
        item.id,
        uploadStatuses.PREPARING,
        {
          force:
            true,

          reason:
            "upload-manager-item-starting",

          metadata: {
            strategy
          }
        }
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.ITEM_STARTED,
        {
          task:
            task.toJSON(),

          item:
            item.toPublicJSON
              ? item.toPublicJSON()
              : resolvedDeepClone(
                  item
                ),

          strategy
        }
      );

      task.promise =
        this.executeTask(
          task,
          item,
          options
        );

      try {
        const result =
          await task.promise;

        task.markCompleted();

        this.emit(
          UPLOAD_MANAGER_EVENTS.ITEM_COMPLETED,
          {
            task:
              task.toJSON(),

            item:
              item.toPublicJSON
                ? item.toPublicJSON()
                : resolvedDeepClone(
                    item
                  ),

            result:
              resolvedDeepClone(
                result
              )
          }
        );

        this.scheduleCompletedRemoval(
          item,
          task
        );

        return result;
      } catch (
        taskError
      ) {
        if (
          task.paused
        ) {
          return null;
        }

        if (
          task.canceled ||
          isAbortError(
            taskError
          )
        ) {
          task.markCanceled();

          this.emit(
            UPLOAD_MANAGER_EVENTS.ITEM_CANCELED,
            {
              task:
                task.toJSON(),

              item:
                item.toPublicJSON
                  ? item.toPublicJSON()
                  : resolvedDeepClone(
                      item
                    )
            }
          );

          return null;
        }

        task.markFailed(
          taskError
        );

        const normalizedError =
          resolvedNormalizeError(
            taskError
          );

        this.emit(
          UPLOAD_MANAGER_EVENTS.ITEM_FAILED,
          {
            task:
              task.toJSON(),

            item:
              item.toPublicJSON
                ? item.toPublicJSON()
                : resolvedDeepClone(
                    item
                  ),

            error:
              normalizedError
          }
        );

        if (
          task.canRetry() &&
          isRetryableError(
            taskError
          ) &&
          options.autoRetry !==
            false
        ) {
          await this.scheduleRetry(
            task,
            item,
            taskError,
            options
          );

          return null;
        }

        throw taskError;
      } finally {
        task.promise =
          null;

        task.controller =
          null;

        task.request =
          null;

        this.activeTaskIds.delete(
          task.id
        );

        this.synchronizeStore(
          "upload-manager-task-finished"
        );

        if (
          this.state ===
          UPLOAD_MANAGER_STATE.RUNNING
        ) {
          this.scheduleProcess();
        }
      }
    }

    async executeTask(
      task,
      item,
      options = {}
    ) {
      if (
        task.resolvedStrategy ===
        UPLOAD_STRATEGY.CHUNKED
      ) {
        return this.executeChunkedUpload(
          task,
          item,
          options
        );
      }

      if (
        task.resolvedStrategy ===
        UPLOAD_STRATEGY.DIRECT
      ) {
        return this.executeDirectUpload(
          task,
          item,
          options
        );
      }

      throw createUploadManagerError(
        `Unsupported resolved strategy "${task.resolvedStrategy}".`,
        {
          code:
            UPLOAD_MANAGER_ERROR_CODE.UNSUPPORTED_STRATEGY
        }
      );
    }

    async executeChunkedUpload(
      task,
      item,
      options = {}
    ) {
      let session =
        this.chunkedEngine
          .getSessionByQueueItem(
            item.id
          );

      if (
        !session
      ) {
        session =
          this.chunkedEngine
            .createSession(
              item,
              {
                strategy:
                  UPLOAD_STRATEGY.CHUNKED,

                maximumChunkAttempts:
                  options.maximumChunkAttempts
              }
            );
      }

      task.chunkSessionId =
        session.id;

      const completedSession =
        await this.chunkedEngine
          .start(
            session.id,
            options
          );

      if (
        completedSession.state !==
        chunkedUploadStates.COMPLETED
      ) {
        if (
          completedSession.state ===
          chunkedUploadStates.PAUSED
        ) {
          task.markPaused();

          throw createUploadManagerError(
            "The chunked upload was paused.",
            {
              code:
                UPLOAD_MANAGER_ERROR_CODE.MANAGER_PAUSED
            }
          );
        }

        if (
          completedSession.state ===
          chunkedUploadStates.CANCELED
        ) {
          task.markCanceled();

          throw createUploadManagerError(
            "The chunked upload was canceled.",
            {
              code:
                UPLOAD_MANAGER_ERROR_CODE.DIRECT_UPLOAD_ABORTED
            }
          );
        }
      }

      return completedSession
        .serverMetadata
        ?.finalizeResult ||
        completedSession.toJSON();
    }

    async executeDirectUpload(
      task,
      item,
      options = {}
    ) {
      const controller =
        new AbortController();

      task.controller =
        controller;

      let lastProgressEmission =
        0;

      this.queue.setStatus(
        item.id,
        uploadStatuses.UPLOADING,
        {
          force:
            true,

          reason:
            "direct-upload-started"
        }
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.DIRECT_UPLOAD_STARTED,
        {
          task:
            task.toJSON(),

          item:
            item.toPublicJSON
              ? item.toPublicJSON()
              : resolvedDeepClone(
                  item
                )
        }
      );

      try {
        const response =
          await this.directTransport
            .upload(
              item,
              {
                controller,

                endpoint:
                  options.directUploadEndpoint,

                timeoutMilliseconds:
                  options.directUploadTimeoutMilliseconds ||
                  this.directUploadTimeoutMilliseconds,

                headers:
                  options.headers,

                fileFieldName:
                  options.fileFieldName,

                onRequestCreated:
                  request => {
                    task.request =
                      request;
                  },

                onProgress:
                  progressData => {
                    const currentTimestamp =
                      Date.now();

                    if (
                      currentTimestamp -
                      lastProgressEmission <
                        this.progressThrottleMilliseconds &&
                      progressData.loaded <
                        progressData.total
                    ) {
                      return;
                    }

                    lastProgressEmission =
                      currentTimestamp;

                    this.queue.setProgress(
                      item.id,
                      progressData.progress,
                      {
                        uploadedBytes:
                          progressData.loaded,

                        totalBytes:
                          progressData.total,

                        persist:
                          true,

                        notifySubscribers:
                          true
                      }
                    );

                    this.emit(
                      UPLOAD_MANAGER_EVENTS.DIRECT_UPLOAD_PROGRESS,
                      {
                        task:
                          task.toJSON(),

                        itemId:
                          item.id,

                        progress:
                          progressData.progress,

                        uploadedBytes:
                          progressData.loaded,

                        totalBytes:
                          progressData.total
                      }
                    );
                  }
              }
            );

        const result =
          normalizeDirectUploadResponse(
            response.body
          );

        this.queue.complete(
          item.id,
          result,
          {
            force:
              true,

            reason:
              "direct-upload-completed"
          }
        );

        this.emit(
          UPLOAD_MANAGER_EVENTS.DIRECT_UPLOAD_COMPLETED,
          {
            task:
              task.toJSON(),

            item:
              item.toPublicJSON
                ? item.toPublicJSON()
                : resolvedDeepClone(
                    item
                  ),

            result:
              resolvedDeepClone(
                result
              )
          }
        );

        return result;
      } catch (
        directUploadError
      ) {
        if (
          task.paused ||
          task.canceled
        ) {
          throw directUploadError;
        }

        const normalizedError =
          resolvedNormalizeError(
            directUploadError,
            "The direct upload failed."
          );

        this.queue.fail(
          item.id,
          normalizedError,
          {
            force:
              true,

            reason:
              "direct-upload-failed"
          }
        );

        this.emit(
          UPLOAD_MANAGER_EVENTS.DIRECT_UPLOAD_FAILED,
          {
            task:
              task.toJSON(),

            item:
              item.toPublicJSON
                ? item.toPublicJSON()
                : resolvedDeepClone(
                    item
                  ),

            error:
              normalizedError
          }
        );

        throw directUploadError;
      }
    }

    async scheduleRetry(
      task,
      item,
      error,
      options = {}
    ) {
      const delayMilliseconds =
        Math.max(
          this.networkRetryDelayMilliseconds,
          this.networkRetryDelayMilliseconds *
          Math.pow(
            2,
            Math.max(
              0,
              task.attempt -
              1
            )
          )
        );

      task.resetForRetry();

      this.queue.setStatus(
        item.id,
        uploadStatuses.RETRYING,
        {
          force:
            true,

          reason:
            "upload-manager-retrying",

          error
        }
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.ITEM_RETRYING,
        {
          task:
            task.toJSON(),

          item:
            item.toPublicJSON
              ? item.toPublicJSON()
              : resolvedDeepClone(
                  item
                ),

          delayMilliseconds,

          error:
            resolvedNormalizeError(
              error
            )
        }
      );

      await resolvedDelay(
        delayMilliseconds
      );

      if (
        task.canceled ||
        task.paused ||
        this.state !==
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        return;
      }

      this.queue.setStatus(
        item.id,
        uploadStatuses.QUEUED,
        {
          force:
            true,

          reason:
            "upload-manager-retry-queued"
        }
      );
    }

    async pauseItem(
      taskOrQueueItemId,
      options = {}
    ) {
      const task =
        this.getTask(
          taskOrQueueItemId
        );

      if (
        !task
      ) {
        const item =
          this.queue.get(
            taskOrQueueItemId
          );

        if (
          item
        ) {
          this.queue.pause(
            item.id,
            {
              force:
                true,

              reason:
                options.reason ||
                "upload-manager-item-paused"
            }
          );
        }

        return item ||
          null;
      }

      const item =
        this.queue.get(
          task.queueItemId
        );

      task.markPaused();

      if (
        task.resolvedStrategy ===
          UPLOAD_STRATEGY.CHUNKED &&
        task.chunkSessionId
      ) {
        this.chunkedEngine.pause(
          task.chunkSessionId
        );
      } else if (
        task.controller
      ) {
        task.controller.abort();

        if (
          item
        ) {
          this.queue.pause(
            item.id,
            {
              force:
                true,

              reason:
                options.reason ||
                "direct-upload-paused"
            }
          );
        }
      } else if (
        item
      ) {
        this.queue.pause(
          item.id,
          {
            force:
              true,

            reason:
              options.reason ||
              "upload-manager-item-paused"
          }
        );
      }

      this.emit(
        UPLOAD_MANAGER_EVENTS.ITEM_PAUSED,
        {
          task:
            task.toJSON(),

          item:
            item?.toPublicJSON
              ? item.toPublicJSON()
              : item ||
                null
        }
      );

      return task;
    }

    async resumeItem(
      taskOrQueueItemId,
      options = {}
    ) {
      const task =
        this.getTask(
          taskOrQueueItemId
        );

      const item =
        task
          ? this.queue.get(
              task.queueItemId
            )
          : this.queue.get(
              taskOrQueueItemId
            );

      if (
        !item
      ) {
        throw createUploadManagerError(
          "The upload queue item could not be found.",
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.INVALID_ITEM
          }
        );
      }

      if (
        !item.file
      ) {
        throw createUploadManagerError(
          `The original file for "${item.name}" must be selected again before resuming.`,
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.FILE_UNAVAILABLE
          }
        );
      }

      if (
        task
      ) {
        task.paused =
          false;

        task.canceled =
          false;

        task.failed =
          false;

        task.error =
          null;

        task.updatedAt =
          nowIsoString();
      }

      this.queue.resume(
        item.id,
        {
          force:
            true,

          reason:
            "upload-manager-item-resumed"
        }
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.ITEM_RESUMED,
        {
          task:
            task
              ? task.toJSON()
              : null,

          item:
            item.toPublicJSON
              ? item.toPublicJSON()
              : resolvedDeepClone(
                  item
                )
        }
      );

      if (
        this.state !==
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.resume();
      }

      this.scheduleProcess();

      return item;
    }

    async cancelItem(
      taskOrQueueItemId,
      options = {}
    ) {
      const task =
        this.getTask(
          taskOrQueueItemId
        );

      const item =
        task
          ? this.queue.get(
              task.queueItemId
            )
          : this.queue.get(
              taskOrQueueItemId
            );

      if (
        task
      ) {
        task.markCanceled();

        if (
          task.resolvedStrategy ===
            UPLOAD_STRATEGY.CHUNKED &&
          task.chunkSessionId
        ) {
          await this.chunkedEngine
            .cancel(
              task.chunkSessionId,
              options
            );
        } else if (
          task.controller
        ) {
          task.controller.abort();
        }
      }

      if (
        item &&
        item.status !==
          uploadStatuses.CANCELED
      ) {
        this.queue.cancel(
          item.id,
          {
            force:
              true,

            reason:
              options.reason ||
              "upload-manager-item-canceled"
          }
        );
      }

      this.emit(
        UPLOAD_MANAGER_EVENTS.ITEM_CANCELED,
        {
          task:
            task
              ? task.toJSON()
              : null,

          item:
            item?.toPublicJSON
              ? item.toPublicJSON()
              : item ||
                null
        }
      );

      return task ||
        item ||
        null;
    }

    async retryItem(
      taskOrQueueItemId,
      options = {}
    ) {
      const task =
        this.getTask(
          taskOrQueueItemId
        );

      const item =
        task
          ? this.queue.get(
              task.queueItemId
            )
          : this.queue.get(
              taskOrQueueItemId
            );

      if (
        !item
      ) {
        throw createUploadManagerError(
          "The upload queue item could not be found.",
          {
            code:
              UPLOAD_MANAGER_ERROR_CODE.INVALID_ITEM
          }
        );
      }

      if (
        task
      ) {
        if (
          !task.canRetry() &&
          options.force !==
            true
        ) {
          throw createUploadManagerError(
            `"${item.name}" has reached the maximum retry limit.`,
            {
              code:
                UPLOAD_MANAGER_ERROR_CODE.PROCESSING_FAILED
            }
          );
        }

        task.resetForRetry();
      }

      this.queue.retry(
        item.id,
        {
          force:
            options.force ===
            true,

          reason:
            "upload-manager-manual-retry"
        }
      );

      if (
        this.state !==
        UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.resume();
      }

      this.scheduleProcess();

      return item;
    }

    async pauseAll(
      options = {}
    ) {
      const tasks =
        this.getTasks({
          running:
            true
        });

      await Promise.allSettled(
        tasks.map(
          task =>
            this.pauseItem(
              task.id,
              options
            )
        )
      );

      return tasks.length;
    }

    async resumeAll(
      options = {}
    ) {
      const pausedItems =
        this.queue.getItems({
          status:
            uploadStatuses.PAUSED
        });

      const filteredItems =
        options.onlyOfflinePaused
          ? pausedItems.filter(
              item =>
                item.metadata
                  ?.offlinePaused ===
                true
            )
          : pausedItems;

      for (
        const item
        of filteredItems
      ) {
        try {
          await this.resumeItem(
            item.id,
            options
          );
        } catch (
          resumeError
        ) {
          console.warn(
            `[AIFT Media Library] "${item.name}" could not be resumed:`,
            resumeError
          );
        }
      }

      return filteredItems.length;
    }

    async cancelAll(
      options = {}
    ) {
      const tasks =
        this.getTasks()
          .filter(
            task =>
              !task.completed &&
              !task.canceled
          );

      await Promise.allSettled(
        tasks.map(
          task =>
            this.cancelItem(
              task.id,
              options
            )
        )
      );

      return tasks.length;
    }

    scheduleCompletedRemoval(
      item,
      task
    ) {
      if (
        this.removeCompletedAfterMilliseconds <=
        0
      ) {
        return;
      }

      if (
        this.cleanupTimers.has(
          item.id
        )
      ) {
        windowObject.clearTimeout(
          this.cleanupTimers.get(
            item.id
          )
        );
      }

      const timerId =
        windowObject.setTimeout(
          () => {
            this.cleanupTimers.delete(
              item.id
            );

            try {
              this.queue.remove(
                item.id,
                {
                  force:
                    true,

                  reason:
                    "completed-upload-auto-removed"
                }
              );

              this.tasks.delete(
                task.id
              );
            } catch (
              removalError
            ) {
              console.warn(
                "[AIFT Media Library] Completed upload could not be removed:",
                removalError
              );
            }
          },
          this.removeCompletedAfterMilliseconds
        );

      this.cleanupTimers.set(
        item.id,
        timerId
      );
    }

    cleanupCompletedTasks() {
      this.queue.trimCompleted(
        this.completedRetentionCount
      );

      const completedTasks =
        this.getTasks({
          completed:
            true
        })
          .sort(
            (
              firstTask,
              secondTask
            ) =>
              (
                Date.parse(
                  secondTask.completedAt
                ) ||
                0
              ) -
              (
                Date.parse(
                  firstTask.completedAt
                ) ||
                0
              )
          );

      const removableTasks =
        completedTasks.slice(
          this.completedRetentionCount
        );

      for (
        const task
        of removableTasks
      ) {
        this.tasks.delete(
          task.id
        );
      }

      if (
        removableTasks.length
      ) {
        this.emit(
          UPLOAD_MANAGER_EVENTS.CLEANUP_COMPLETED,
          {
            removedTaskCount:
              removableTasks.length
          }
        );
      }

      return removableTasks.length;
    }

    add(
      file,
      options = {}
    ) {
      return this.queue.add(
        file,
        {
          ...options,

          source:
            options.source ||
            uploadSources.PROGRAMMATIC
        }
      ).then(
        item => {
          this.createTask(
            item,
            options
          );

          if (
            options.autoStart !==
            false &&
            this.started &&
            this.state ===
              UPLOAD_MANAGER_STATE.RUNNING
          ) {
            this.scheduleProcess();
          }

          return item;
        }
      );
    }

    async addMany(
      files,
      options = {}
    ) {
      const result =
        await this.queue.addMany(
          files,
          {
            ...options,

            source:
              options.source ||
              uploadSources.PROGRAMMATIC
          }
        );

      for (
        const item
        of result.added
      ) {
        this.createTask(
          item,
          options
        );
      }

      if (
        result.added.length &&
        options.autoStart !==
          false &&
        this.started &&
        this.state ===
          UPLOAD_MANAGER_STATE.RUNNING
      ) {
        this.scheduleProcess();
      }

      return result;
    }

    getSnapshot() {
      const tasks =
        this.getTasks();

      return {
        version:
          UPLOAD_MANAGER_VERSION,

        state:
          this.state,

        started:
          this.started,

        online:
          windowObject.navigator
            .onLine,

        maximumParallelUploads:
          this.maximumParallelUploads,

        activeTaskCount:
          this.activeTaskIds.size,

        scheduledTaskCount:
          tasks.length,

        completedTaskCount:
          tasks.filter(
            task =>
              task.completed
          ).length,

        failedTaskCount:
          tasks.filter(
            task =>
              task.failed
          ).length,

        pausedTaskCount:
          tasks.filter(
            task =>
              task.paused
          ).length,

        canceledTaskCount:
          tasks.filter(
            task =>
              task.canceled
          ).length,

        lastProcessAt:
          this.lastProcessAt,

        lastQueueDrainAt:
          this.lastQueueDrainAt,

        queue:
          this.queue.getSnapshot(),

        chunked:
          this.chunkedEngine
            .getSnapshot(),

        tasks:
          tasks.map(
            task =>
              task.toJSON()
          )
      };
    }

    synchronizeStore(
      reason
    ) {
      if (
        !store ||
        !resolvedIsFunction(
          store.setState
        )
      ) {
        return;
      }

      const tasks =
        this.getTasks();

      store.setState(
        {
          uploadManager: {
            initialized:
              true,

            version:
              UPLOAD_MANAGER_VERSION,

            state:
              this.state,

            started:
              this.started,

            online:
              windowObject.navigator
                .onLine,

            maximumParallelUploads:
              this.maximumParallelUploads,

            activeTaskCount:
              this.activeTaskIds.size,

            scheduledTaskCount:
              tasks.length,

            completedTaskCount:
              tasks.filter(
                task =>
                  task.completed
              ).length,

            failedTaskCount:
              tasks.filter(
                task =>
                  task.failed
              ).length,

            pausedTaskCount:
              tasks.filter(
                task =>
                  task.paused
              ).length,

            canceledTaskCount:
              tasks.filter(
                task =>
                  task.canceled
              ).length,

            lastProcessAt:
              this.lastProcessAt,

            lastQueueDrainAt:
              this.lastQueueDrainAt
          }
        },
        {
          reason:
            resolvedSafeString(
              reason,
              "upload-manager-synchronized"
            )
        }
      );
    }

    emitStateChange(
      previousState,
      reason
    ) {
      this.synchronizeStore(
        reason
      );

      this.emit(
        UPLOAD_MANAGER_EVENTS.STATE_CHANGED,
        {
          previousState:
            normalizeManagerState(
              previousState
            ),

          state:
            this.state,

          reason:
            resolvedSafeString(
              reason
            )
        }
      );
    }

    emit(
      eventName,
      payload = {}
    ) {
      if (
        this.eventBus &&
        resolvedIsFunction(
          this.eventBus.emit
        )
      ) {
        this.eventBus.emit(
          eventName,
          {
            ...payload,

            timestamp:
              nowIsoString()
          }
        );
      }
    }

    async destroy() {
      if (
        this.destroyed
      ) {
        return;
      }

      try {
        await this.stop({
          pauseActive:
            true
        });
      } catch (
        stopError
      ) {
        console.warn(
          "[AIFT Media Library] Upload manager stop failed during destruction:",
          stopError
        );
      }

      windowObject.removeEventListener(
        "online",
        this.boundHandleOnline
      );

      windowObject.removeEventListener(
        "offline",
        this.boundHandleOffline
      );

      documentObject.removeEventListener(
        "visibilitychange",
        this.boundHandleVisibilityChange
      );

      if (
        resolvedIsFunction(
          this.queueUnsubscribe
        )
      ) {
        this.queueUnsubscribe();

        this.queueUnsubscribe =
          null;
      }

      this.clearProcessTimer();

      for (
        const timerId
        of this.cleanupTimers.values()
      ) {
        windowObject.clearTimeout(
          timerId
        );
      }

      this.cleanupTimers.clear();

      this.tasks.clear();

      this.activeTaskIds.clear();

      this.started =
        false;

      this.destroyed =
        true;

      this.state =
        UPLOAD_MANAGER_STATE.DESTROYED;

      this.synchronizeStore(
        "upload-manager-destroyed"
      );
    }
  }

  /* =========================================================
     MANAGER CONFIGURATION
  ========================================================= */

  function resolveUploadManagerConfiguration() {
    const rootConfiguration =
      mediaLibrary.configuration ||
      application.configuration ||
      {};

    const uploadConfiguration =
      resolvedIsObject(
        rootConfiguration.upload
      )
        ? rootConfiguration.upload
        : {};

    const managerConfiguration =
      resolvedIsObject(
        uploadConfiguration.manager
      )
        ? uploadConfiguration.manager
        : {};

    return {
      maximumParallelUploads:
        Math.max(
          1,
          resolvedSafeInteger(
            managerConfiguration.maximumParallelUploads,
            DEFAULT_MAXIMUM_PARALLEL_UPLOADS
          )
        ),

      smallFileThresholdBytes:
        Math.max(
          1,
          normalizeByteCount(
            managerConfiguration.smallFileThresholdBytes ||
            DEFAULT_SMALL_FILE_THRESHOLD_BYTES
          )
        ),

      directUploadTimeoutMilliseconds:
        Math.max(
          1000,
          resolvedSafeInteger(
            managerConfiguration.directUploadTimeoutMilliseconds,
            rootConfiguration.uploadTimeoutMilliseconds ||
            DEFAULT_DIRECT_UPLOAD_TIMEOUT_MS
          )
        ),

      processIntervalMilliseconds:
        Math.max(
          25,
          resolvedSafeInteger(
            managerConfiguration.processIntervalMilliseconds,
            DEFAULT_PROCESS_INTERVAL_MS
          )
        ),

      networkRetryDelayMilliseconds:
        Math.max(
          250,
          resolvedSafeInteger(
            managerConfiguration.networkRetryDelayMilliseconds,
            DEFAULT_NETWORK_RETRY_DELAY_MS
          )
        ),

      maximumFileAttempts:
        Math.max(
          1,
          resolvedSafeInteger(
            managerConfiguration.maximumFileAttempts,
            DEFAULT_MAXIMUM_FILE_ATTEMPTS
          )
        ),

      autoStart:
        managerConfiguration.autoStart !==
        false,

      autoResumeOnline:
        managerConfiguration.autoResumeOnline !==
        false,

      autoPauseOffline:
        managerConfiguration.autoPauseOffline !==
        false,

      removeCompletedAfterMilliseconds:
        Math.max(
          0,
          resolvedSafeInteger(
            managerConfiguration.removeCompletedAfterMilliseconds,
            DEFAULT_REMOVE_COMPLETED_AFTER_MS
          )
        ),

      completedRetentionCount:
        Math.max(
          0,
          resolvedSafeInteger(
            managerConfiguration.completedRetentionCount,
            DEFAULT_COMPLETED_RETENTION_COUNT
          )
        ),

      progressThrottleMilliseconds:
        Math.max(
          0,
          resolvedSafeInteger(
            managerConfiguration.progressThrottleMilliseconds,
            DEFAULT_PROGRESS_THROTTLE_MS
          )
        ),

      defaultStrategy:
        normalizeUploadStrategy(
          managerConfiguration.defaultStrategy,
          UPLOAD_STRATEGY.AUTO
        ),

      directUploadEndpoint:
        resolvedSafeString(
          managerConfiguration.directUploadEndpoint ||
          rootConfiguration
            .endpoints
            ?.upload,
          DEFAULT_DIRECT_UPLOAD_ENDPOINT
        ),

      fileFieldName:
        resolvedSafeString(
          managerConfiguration.fileFieldName,
          "file"
        ),

      withCredentials:
        managerConfiguration.withCredentials ===
        true
    };
  }

  const uploadManagerConfiguration =
    resolveUploadManagerConfiguration();

  const directUploadTransport =
    new DirectUploadTransport({
      endpoint:
        uploadManagerConfiguration
          .directUploadEndpoint,

      timeoutMilliseconds:
        uploadManagerConfiguration
          .directUploadTimeoutMilliseconds,

      fileFieldName:
        uploadManagerConfiguration
          .fileFieldName,

      withCredentials:
        uploadManagerConfiguration
          .withCredentials
    });

  const uploadManager =
    new UploadManager({
      ...uploadManagerConfiguration,

      queue:
        uploadQueue,

      chunkedEngine:
        chunkedUploadEngine,

      eventBus,

      notifications,

      directTransport:
        directUploadTransport
    });

  /* =========================================================
     APPLICATION CLEANUP INTEGRATION
  ========================================================= */

  if (
    application &&
    resolvedIsFunction(
      application.registerCleanup
    )
  ) {
    application.registerCleanup(
      () => {
        return uploadManager.destroy();
      }
    );
  }

  /* =========================================================
     PUBLIC MANAGER INTERFACE
  ========================================================= */

  const uploadManagerPublicInterface = {
    version:
      UPLOAD_MANAGER_VERSION,

    strategies:
      UPLOAD_STRATEGY,

    states:
      UPLOAD_MANAGER_STATE,

    errorCodes:
      UPLOAD_MANAGER_ERROR_CODE,

    events:
      UPLOAD_MANAGER_EVENTS,

    configuration:
      uploadManagerConfiguration,

    manager:
      uploadManager,

    directTransport:
      directUploadTransport,

    classes: {
      DirectUploadTransport,

      ManagedUploadTask,

      UploadManager
    },

    start() {
      return uploadManager.start();
    },

    stop(
      options
    ) {
      return uploadManager.stop(
        options
      );
    },

    pause() {
      return uploadManager.pause();
    },

    resume() {
      return uploadManager.resume();
    },

    process() {
      return uploadManager.process();
    },

    add(
      file,
      options
    ) {
      return uploadManager.add(
        file,
        options
      );
    },

    addMany(
      files,
      options
    ) {
      return uploadManager.addMany(
        files,
        options
      );
    },

    startItem(
      itemOrId,
      options
    ) {
      return uploadManager.startItem(
        itemOrId,
        options
      );
    },

    pauseItem(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.pauseItem(
        taskOrQueueItemId,
        options
      );
    },

    resumeItem(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.resumeItem(
        taskOrQueueItemId,
        options
      );
    },

    cancelItem(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.cancelItem(
        taskOrQueueItemId,
        options
      );
    },

    retryItem(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.retryItem(
        taskOrQueueItemId,
        options
      );
    },

    pauseAll(
      options
    ) {
      return uploadManager.pauseAll(
        options
      );
    },

    resumeAll(
      options
    ) {
      return uploadManager.resumeAll(
        options
      );
    },

    cancelAll(
      options
    ) {
      return uploadManager.cancelAll(
        options
      );
    },

    getTask(
      taskOrQueueItemId
    ) {
      return uploadManager.getTask(
        taskOrQueueItemId
      );
    },

    getTasks(
      options
    ) {
      return uploadManager.getTasks(
        options
      );
    },

    getSnapshot() {
      return uploadManager
        .getSnapshot();
    },

    destroy() {
      return uploadManager.destroy();
    }
  };

  /* =========================================================
     CORE INTERFACE EXTENSION
  ========================================================= */

  uploads.manager =
    uploadManagerPublicInterface;

  mediaLibrary.uploadManager =
    uploadManager;

  mediaLibrary.uploadManagerInterface =
    uploadManagerPublicInterface;

  mediaLibrary.uploadManagerEvents =
    UPLOAD_MANAGER_EVENTS;

  mediaLibrary.uploadStrategies =
    UPLOAD_STRATEGY;

  mediaLibrary.uploadManagerStates =
    UPLOAD_MANAGER_STATE;

  mediaLibrary.classes = {
    ...mediaLibrary.classes,

    DirectUploadTransport,

    ManagedUploadTask,

    UploadManager
  };

  mediaLibrary.startUploadManager =
    function startUploadManager() {
      return uploadManager.start();
    };

  mediaLibrary.stopUploadManager =
    function stopUploadManager(
      options
    ) {
      return uploadManager.stop(
        options
      );
    };

  mediaLibrary.pauseUploadManager =
    function pauseUploadManager() {
      return uploadManager.pause();
    };

  mediaLibrary.resumeUploadManager =
    function resumeUploadManager() {
      return uploadManager.resume();
    };

  mediaLibrary.processUploadQueue =
    function processUploadQueue() {
      return uploadManager.process();
    };

  mediaLibrary.queueUpload =
    function queueUpload(
      file,
      options
    ) {
      return uploadManager.add(
        file,
        options
      );
    };

  mediaLibrary.queueUploads =
    function queueUploads(
      files,
      options
    ) {
      return uploadManager.addMany(
        files,
        options
      );
    };

  mediaLibrary.startUpload =
    function startUpload(
      itemOrId,
      options
    ) {
      return uploadManager.startItem(
        itemOrId,
        options
      );
    };

  mediaLibrary.pauseManagedUpload =
    function pauseManagedUpload(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.pauseItem(
        taskOrQueueItemId,
        options
      );
    };

  mediaLibrary.resumeManagedUpload =
    function resumeManagedUpload(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.resumeItem(
        taskOrQueueItemId,
        options
      );
    };

  mediaLibrary.cancelManagedUpload =
    function cancelManagedUpload(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.cancelItem(
        taskOrQueueItemId,
        options
      );
    };

  mediaLibrary.retryManagedUpload =
    function retryManagedUpload(
      taskOrQueueItemId,
      options
    ) {
      return uploadManager.retryItem(
        taskOrQueueItemId,
        options
      );
    };

  mediaLibrary.getUploadManagerSnapshot =
    function getUploadManagerSnapshot() {
      return uploadManager
        .getSnapshot();
    };

  mediaLibrary.__uploadManagerInitialized =
    true;

  /* =========================================================
     MANAGER READY EVENT
  ========================================================= */

  eventBus.emit(
    UPLOAD_MANAGER_EVENTS.INITIALIZED,
    {
      version:
        UPLOAD_MANAGER_VERSION,

      configuration:
        resolvedDeepClone(
          uploadManagerConfiguration
        ),

      snapshot:
        uploadManager
          .getSnapshot(),

      timestamp:
        nowIsoString()
    }
  );
})(
  window,
  document
);
"use strict";

/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2D OF 15
   DRAG AND DROP ENGINE
========================================================= */

(function initializeAiftMediaDragDropEngine(
  windowObject,
  documentObject
) {
  if (
    !windowObject ||
    !documentObject
  ) {
    return;
  }

  const mediaLibrary =
    windowObject.AIFTMediaLibrary;

  if (
    !mediaLibrary ||
    !mediaLibrary.__coreInitialized
  ) {
    console.error(
      "[AIFT Media Library] Part 2D requires Part 1 to be loaded first."
    );

    return;
  }

  if (
    !mediaLibrary.__uploadQueueInitialized ||
    !mediaLibrary.uploads
  ) {
    console.error(
      "[AIFT Media Library] Part 2D requires Part 2A to be loaded first."
    );

    return;
  }

  if (
    !mediaLibrary.__uploadManagerInitialized ||
    !mediaLibrary.uploadManager
  ) {
    console.error(
      "[AIFT Media Library] Part 2D requires Part 2C to be loaded first."
    );

    return;
  }

  if (
    mediaLibrary.__dragDropEngineInitialized
  ) {
    console.warn(
      "[AIFT Media Library] Drag and drop engine has already been initialized."
    );

    return;
  }

  /* =========================================================
     CORE REFERENCES
  ========================================================= */

  const application =
    mediaLibrary.application;

  const store =
    mediaLibrary.store;

  const eventBus =
    mediaLibrary.eventBus;

  const notifications =
    mediaLibrary.notifications;

  const uploads =
    mediaLibrary.uploads;

  const uploadQueue =
    uploads.queue;

  const uploadSources =
    uploads.sources;

  const uploadManager =
    mediaLibrary.uploadManager;

  const utilities =
    mediaLibrary.utilities ||
    {};

  const {
    isObject,
    isFunction,
    safeString,
    safeNumber,
    safeInteger,
    clampNumber,
    normalizeArray,
    createId,
    debounce,
    normalizeError,
    deepClone
  } = utilities;

  /* =========================================================
     DRAG AND DROP CONSTANTS
  ========================================================= */

  const DRAG_DROP_ENGINE_VERSION =
    "1.0.0";

  const DEFAULT_DROP_TARGET_SELECTORS =
    Object.freeze([
      "#section-media",
      "#mediaLibraryList",
      "#aiftMediaLibraryList",
      "#mediaLibraryGrid",
      "[data-media-drop-zone]",
      "[data-aift-media-drop-zone]"
    ]);

  const DEFAULT_DRAG_ACTIVE_CLASS =
    "aift-media-drag-active";

  const DEFAULT_DROP_READY_CLASS =
    "aift-media-drop-ready";

  const DEFAULT_DROP_REJECTED_CLASS =
    "aift-media-drop-rejected";

  const DEFAULT_DROP_PROCESSING_CLASS =
    "aift-media-drop-processing";

  const DEFAULT_OVERLAY_ID =
    "aiftMediaDropOverlay";

  const DEFAULT_MAXIMUM_DIRECTORY_DEPTH =
    32;

  const DEFAULT_MAXIMUM_DISCOVERED_ITEMS =
    5000;

  const DEFAULT_MAXIMUM_FILE_COUNT_PER_DROP =
    500;

  const DEFAULT_DRAG_LEAVE_DELAY_MS =
    75;

  const DEFAULT_DIRECTORY_READ_BATCH_LIMIT =
    100;

  const DEFAULT_AUTO_START_UPLOADS =
    true;

  const DEFAULT_ALLOW_DIRECTORIES =
    true;

  const DEFAULT_ALLOW_PASTE =
    true;

  const DEFAULT_PREVENT_WINDOW_FILE_NAVIGATION =
    true;

  const DEFAULT_OVERLAY_ENABLED =
    true;

  const DEFAULT_DROP_ZONE_REQUIRED =
    false;

  const DRAG_DROP_STATE =
    Object.freeze({
      IDLE:
        "idle",

      ENTERING:
        "entering",

      ACTIVE:
        "active",

      PROCESSING:
        "processing",

      REJECTED:
        "rejected",

      COMPLETED:
        "completed",

      DESTROYED:
        "destroyed"
    });

  const DROP_PAYLOAD_TYPE =
    Object.freeze({
      FILES:
        "files",

      DIRECTORY:
        "directory",

      MIXED:
        "mixed",

      URI:
        "uri",

      TEXT:
        "text",

      UNKNOWN:
        "unknown"
    });

  const DROP_REJECTION_REASON =
    Object.freeze({
      NO_FILES:
        "no-files",

      FILE_LIMIT:
        "file-limit",

      DIRECTORY_NOT_ALLOWED:
        "directory-not-allowed",

      TARGET_NOT_ALLOWED:
        "target-not-allowed",

      ENGINE_DISABLED:
        "engine-disabled",

      DISCOVERY_LIMIT:
        "discovery-limit",

      UNSUPPORTED_PAYLOAD:
        "unsupported-payload",

      PROCESSING_FAILED:
        "processing-failed"
    });

  const DRAG_DROP_ERROR_CODE =
    Object.freeze({
      INVALID_EVENT:
        "DRAG_DROP_INVALID_EVENT",

      INVALID_TARGET:
        "DRAG_DROP_INVALID_TARGET",

      NO_FILES:
        "DRAG_DROP_NO_FILES",

      TOO_MANY_FILES:
        "DRAG_DROP_TOO_MANY_FILES",

      DIRECTORY_NOT_ALLOWED:
        "DRAG_DROP_DIRECTORY_NOT_ALLOWED",

      DIRECTORY_READ_FAILED:
        "DRAG_DROP_DIRECTORY_READ_FAILED",

      DISCOVERY_LIMIT_EXCEEDED:
        "DRAG_DROP_DISCOVERY_LIMIT_EXCEEDED",

      ITEM_PROCESSING_FAILED:
        "DRAG_DROP_ITEM_PROCESSING_FAILED",

      UNSUPPORTED_PAYLOAD:
        "DRAG_DROP_UNSUPPORTED_PAYLOAD",

      ENGINE_DISABLED:
        "DRAG_DROP_ENGINE_DISABLED",

      UNKNOWN:
        "DRAG_DROP_UNKNOWN"
    });

  const DRAG_DROP_EVENTS =
    Object.freeze({
      INITIALIZED:
        "media-library:drag-drop-initialized",

      ENABLED:
        "media-library:drag-drop-enabled",

      DISABLED:
        "media-library:drag-drop-disabled",

      STATE_CHANGED:
        "media-library:drag-drop-state-changed",

      DRAG_ENTER:
        "media-library:drag-enter",

      DRAG_OVER:
        "media-library:drag-over",

      DRAG_LEAVE:
        "media-library:drag-leave",

      DRAG_ENDED:
        "media-library:drag-ended",

      DROP_RECEIVED:
        "media-library:drop-received",

      DROP_ACCEPTED:
        "media-library:drop-accepted",

      DROP_REJECTED:
        "media-library:drop-rejected",

      DROP_PROCESSING:
        "media-library:drop-processing",

      DROP_COMPLETED:
        "media-library:drop-completed",

      DROP_FAILED:
        "media-library:drop-failed",

      FILE_DISCOVERED:
        "media-library:drop-file-discovered",

      DIRECTORY_DISCOVERED:
        "media-library:drop-directory-discovered",

      DIRECTORY_READING:
        "media-library:drop-directory-reading",

      DIRECTORY_READ:
        "media-library:drop-directory-read",

      FILES_QUEUED:
        "media-library:drop-files-queued",

      FILE_REJECTED:
        "media-library:drop-file-rejected",

      PASTE_RECEIVED:
        "media-library:paste-received",

      PASTE_COMPLETED:
        "media-library:paste-completed",

      OVERLAY_SHOWN:
        "media-library:drop-overlay-shown",

      OVERLAY_HIDDEN:
        "media-library:drop-overlay-hidden"
    });

  /* =========================================================
     UTILITY FALLBACKS
  ========================================================= */

  function localIsObject(
    value
  ) {
    return (
      value !== null &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  }

  function localIsFunction(
    value
  ) {
    return typeof value ===
      "function";
  }

  function localSafeString(
    value,
    fallback = ""
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    const normalizedValue =
      String(value).trim();

    return normalizedValue ||
      fallback;
  }

  function localSafeNumber(
    value,
    fallback = 0
  ) {
    const numericValue =
      Number(value);

    return Number.isFinite(
      numericValue
    )
      ? numericValue
      : fallback;
  }

  function localSafeInteger(
    value,
    fallback = 0
  ) {
    return Math.trunc(
      localSafeNumber(
        value,
        fallback
      )
    );
  }

  function localClampNumber(
    value,
    minimum,
    maximum
  ) {
    return Math.min(
      maximum,
      Math.max(
        minimum,
        localSafeNumber(
          value,
          minimum
        )
      )
    );
  }

  function localNormalizeArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    return [value];
  }

  function localCreateId(
    prefix =
      "id"
  ) {
    return [
      prefix,
      Date.now()
        .toString(36),
      Math.random()
        .toString(36)
        .slice(
          2,
          12
        )
    ].join("-");
  }

  function localDebounce(
    callback,
    delayMilliseconds =
      0
  ) {
    let timeoutId =
      null;

    return function debouncedFunction(
      ...argumentsList
    ) {
      if (
        timeoutId
      ) {
        windowObject.clearTimeout(
          timeoutId
        );
      }

      timeoutId =
        windowObject.setTimeout(
          () => {
            timeoutId =
              null;

            callback.apply(
              this,
              argumentsList
            );
          },
          Math.max(
            0,
            localSafeInteger(
              delayMilliseconds,
              0
            )
          )
        );
    };
  }

  function localNormalizeError(
    error,
    fallbackMessage =
      "An unexpected drag and drop error occurred."
  ) {
    if (
      error instanceof Error
    ) {
      return {
        name:
          error.name ||
          "Error",

        message:
          error.message ||
          fallbackMessage,

        code:
          error.code ||
          DRAG_DROP_ERROR_CODE.UNKNOWN,

        stack:
          error.stack ||
          "",

        details:
          error.details ||
          null
      };
    }

    if (
      localIsObject(
        error
      )
    ) {
      return {
        name:
          localSafeString(
            error.name,
            "Error"
          ),

        message:
          localSafeString(
            error.message,
            fallbackMessage
          ),

        code:
          localSafeString(
            error.code,
            DRAG_DROP_ERROR_CODE.UNKNOWN
          ),

        stack:
          localSafeString(
            error.stack
          ),

        details:
          error.details ||
          null
      };
    }

    return {
      name:
        "Error",

      message:
        localSafeString(
          error,
          fallbackMessage
        ),

      code:
        DRAG_DROP_ERROR_CODE.UNKNOWN,

      stack:
        "",

      details:
        null
    };
  }

  function localDeepClone(
    value
  ) {
    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (
        cloneError
      ) {
        void cloneError;
      }
    }

    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  }

  const resolvedIsObject =
    isObject ||
    localIsObject;

  const resolvedIsFunction =
    isFunction ||
    localIsFunction;

  const resolvedSafeString =
    safeString ||
    localSafeString;

  const resolvedSafeNumber =
    safeNumber ||
    localSafeNumber;

  const resolvedSafeInteger =
    safeInteger ||
    localSafeInteger;

  const resolvedClampNumber =
    clampNumber ||
    localClampNumber;

  const resolvedNormalizeArray =
    normalizeArray ||
    localNormalizeArray;

  const resolvedCreateId =
    createId ||
    localCreateId;

  const resolvedDebounce =
    debounce ||
    localDebounce;

  const resolvedNormalizeError =
    normalizeError ||
    localNormalizeError;

  const resolvedDeepClone =
    deepClone ||
    localDeepClone;

  /* =========================================================
     GENERAL HELPERS
  ========================================================= */

  function nowIsoString() {
    return new Date()
      .toISOString();
  }

  function createDragDropError(
    message,
    options = {}
  ) {
    const dragDropError =
      new Error(
        resolvedSafeString(
          message,
          "A drag and drop error occurred."
        )
      );

    dragDropError.name =
      "MediaDragDropError";

    dragDropError.code =
      resolvedSafeString(
        options.code,
        DRAG_DROP_ERROR_CODE.UNKNOWN
      );

    dragDropError.details =
      options.details ||
      null;

    dragDropError.cause =
      options.cause ||
      null;

    return dragDropError;
  }

  function normalizeState(
    value,
    fallback =
      DRAG_DROP_STATE.IDLE
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        fallback
      ).toLowerCase();

    if (
      Object.values(
        DRAG_DROP_STATE
      ).includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return fallback;
  }

  function normalizeDropEffect(
    value,
    fallback =
      "copy"
  ) {
    const normalizedValue =
      resolvedSafeString(
        value,
        fallback
      ).toLowerCase();

    if (
      [
        "none",
        "copy",
        "link",
        "move"
      ].includes(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    return fallback;
  }

  function isFileObject(
    value
  ) {
    return (
      typeof File !==
        "undefined" &&
      value instanceof File
    );
  }

  function isBlobObject(
    value
  ) {
    return (
      typeof Blob !==
        "undefined" &&
      value instanceof Blob
    );
  }

  function isElement(
    value
  ) {
    return (
      typeof Element !==
        "undefined" &&
      value instanceof Element
    );
  }

  function isDataTransferFileItem(
    item
  ) {
    return (
      item &&
      item.kind ===
        "file"
    );
  }

  function hasFileTransferType(
    dataTransfer
  ) {
    if (
      !dataTransfer
    ) {
      return false;
    }

    const transferTypes =
      Array.from(
        dataTransfer.types ||
        []
      );

    return transferTypes.includes(
      "Files"
    );
  }

  function normalizeRelativePath(
    path
  ) {
    return resolvedSafeString(
      path
    )
      .replace(
        /\\/g,
        "/"
      )
      .replace(
        /^\/+/,
        ""
      )
      .replace(
        /\/+/g,
        "/"
      );
  }

  function resolveFileRelativePath(
    file,
    fallbackPath =
      ""
  ) {
    return normalizeRelativePath(
      file?.webkitRelativePath ||
      file?.relativePath ||
      fallbackPath
    );
  }

  function attachRelativePath(
    file,
    relativePath
  ) {
    const normalizedPath =
      normalizeRelativePath(
        relativePath
      );

    if (
      !file ||
      !normalizedPath
    ) {
      return file;
    }

    try {
      Object.defineProperty(
        file,
        "relativePath",
        {
          configurable:
            true,

          enumerable:
            false,

          writable:
            true,

          value:
            normalizedPath
        }
      );
    } catch (
      defineError
    ) {
      try {
        file.relativePath =
          normalizedPath;
      } catch (
        assignmentError
      ) {
        void assignmentError;
      }
    }

    return file;
  }

  function resolveEventTargetElement(
    event
  ) {
    const candidate =
      event?.target;

    return isElement(
      candidate
    )
      ? candidate
      : null;
  }

  function findClosestMatchingTarget(
    element,
    selectors
  ) {
    if (
      !element
    ) {
      return null;
    }

    for (
      const selector
      of selectors
    ) {
      const normalizedSelector =
        resolvedSafeString(
          selector
        );

      if (
        !normalizedSelector
      ) {
        continue;
      }

      try {
        const matchedElement =
          element.closest(
            normalizedSelector
          );

        if (
          matchedElement
        ) {
          return matchedElement;
        }
      } catch (
        selectorError
      ) {
        console.warn(
          `[AIFT Media Library] Invalid drop target selector "${normalizedSelector}":`,
          selectorError
        );
      }
    }

    return null;
  }

  function resolveDropPayloadType(
    files,
    directories,
    dataTransfer
  ) {
    const fileCount =
      files.length;

    const directoryCount =
      directories.length;

    if (
      fileCount &&
      directoryCount
    ) {
      return DROP_PAYLOAD_TYPE.MIXED;
    }

    if (
      directoryCount
    ) {
      return DROP_PAYLOAD_TYPE.DIRECTORY;
    }

    if (
      fileCount
    ) {
      return DROP_PAYLOAD_TYPE.FILES;
    }

    const transferTypes =
      Array.from(
        dataTransfer?.types ||
        []
      );

    if (
      transferTypes.includes(
        "text/uri-list"
      )
    ) {
      return DROP_PAYLOAD_TYPE.URI;
    }

    if (
      transferTypes.includes(
        "text/plain"
      )
    ) {
      return DROP_PAYLOAD_TYPE.TEXT;
    }

    return DROP_PAYLOAD_TYPE.UNKNOWN;
  }

  function createFileSummary(
    file
  ) {
    return {
      name:
        resolvedSafeString(
          file?.name,
          "untitled"
        ),

      size:
        Math.max(
          0,
          resolvedSafeInteger(
            file?.size,
            0
          )
        ),

      type:
        resolvedSafeString(
          file?.type,
          "application/octet-stream"
        ),

      lastModified:
        Math.max(
          0,
          resolvedSafeInteger(
            file?.lastModified,
            0
          )
        ),

      relativePath:
        resolveFileRelativePath(
          file
        )
    };
  }

  function buildDropContext(
    event,
    targetElement
  ) {
    const dataset =
      targetElement?.dataset ||
      {};

    const currentClassId =
      resolvedSafeString(
        store?.get?.(
          "context.classId"
        )
      );

    return {
      targetElement,

      targetId:
        resolvedSafeString(
          targetElement?.id
        ),

      targetRole:
        resolvedSafeString(
          dataset.mediaDropRole ||
          dataset.aiftMediaDropRole
        ),

      folderId:
        resolvedSafeString(
          dataset.folderId ||
          dataset.mediaFolderId ||
          dataset.aiftMediaFolderId
        ),

      classId:
        resolvedSafeString(
          dataset.classId ||
          dataset.mediaClassId ||
          dataset.aiftMediaClassId,
          currentClassId
        ),

      source:
        uploadSources
          ?.DRAG_AND_DROP ||
        "drag-and-drop",

      coordinates: {
        clientX:
          resolvedSafeNumber(
            event?.clientX,
            0
          ),

        clientY:
          resolvedSafeNumber(
            event?.clientY,
            0
          ),

        pageX:
          resolvedSafeNumber(
            event?.pageX,
            0
          ),

        pageY:
          resolvedSafeNumber(
            event?.pageY,
            0
          )
      },

      timestamp:
        nowIsoString()
    };
  }

  /* =========================================================
     DIRECTORY ENTRY READER
  ========================================================= */

  class DirectoryEntryReader {
    constructor(
      options = {}
    ) {
      this.maximumDepth =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumDepth,
            DEFAULT_MAXIMUM_DIRECTORY_DEPTH
          )
        );

      this.maximumDiscoveredItems =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumDiscoveredItems,
            DEFAULT_MAXIMUM_DISCOVERED_ITEMS
          )
        );

      this.directoryReadBatchLimit =
        Math.max(
          1,
          resolvedSafeInteger(
            options.directoryReadBatchLimit,
            DEFAULT_DIRECTORY_READ_BATCH_LIMIT
          )
        );

      this.eventBus =
        options.eventBus ||
        eventBus;

      this.discoveryCount =
        0;
    }

    reset() {
      this.discoveryCount =
        0;
    }

    assertDiscoveryLimit() {
      if (
        this.discoveryCount >
        this.maximumDiscoveredItems
      ) {
        throw createDragDropError(
          `The dropped directory contains more than ${this.maximumDiscoveredItems} discoverable items.`,
          {
            code:
              DRAG_DROP_ERROR_CODE.DISCOVERY_LIMIT_EXCEEDED,

            details: {
              maximumDiscoveredItems:
                this.maximumDiscoveredItems
            }
          }
        );
      }
    }

    async readDataTransferItems(
      items,
      options = {}
    ) {
      this.reset();

      const files =
        [];

      const directories =
        [];

      const rejected =
        [];

      const normalizedItems =
        Array.from(
          items ||
          []
        );

      for (
        const item
        of normalizedItems
      ) {
        if (
          !isDataTransferFileItem(
            item
          )
        ) {
          continue;
        }

        try {
          const entry =
            this.resolveEntry(
              item
            );

          if (
            entry
          ) {
            if (
              entry.isDirectory
            ) {
              directories.push({
                name:
                  resolvedSafeString(
                    entry.name
                  ),

                fullPath:
                  normalizeRelativePath(
                    entry.fullPath
                  )
              });

              this.emit(
                DRAG_DROP_EVENTS.DIRECTORY_DISCOVERED,
                {
                  name:
                    resolvedSafeString(
                      entry.name
                    ),

                  fullPath:
                    normalizeRelativePath(
                      entry.fullPath
                    )
                }
              );

              if (
                options.allowDirectories ===
                false
              ) {
                rejected.push({
                  type:
                    "directory",

                  name:
                    resolvedSafeString(
                      entry.name
                    ),

                  reason:
                    DROP_REJECTION_REASON.DIRECTORY_NOT_ALLOWED
                });

                continue;
              }
            }

            const entryFiles =
              await this.readEntry(
                entry,
                {
                  currentDepth:
                    0,

                  parentPath:
                    ""
                }
              );

            files.push(
              ...entryFiles
            );

            continue;
          }

          const file =
            item.getAsFile?.();

          if (
            file
          ) {
            this.discoveryCount +=
              1;

            this.assertDiscoveryLimit();

            files.push(
              file
            );

            this.emit(
              DRAG_DROP_EVENTS.FILE_DISCOVERED,
              {
                file:
                  createFileSummary(
                    file
                  )
              }
            );
          }
        } catch (
          itemError
        ) {
          rejected.push({
            type:
              "item",

            reason:
              DROP_REJECTION_REASON.PROCESSING_FAILED,

            error:
              resolvedNormalizeError(
                itemError
              )
          });
        }
      }

      return {
        files,

        directories,

        rejected
      };
    }

    resolveEntry(
      item
    ) {
      if (
        resolvedIsFunction(
          item.getAsFileSystemHandle
        )
      ) {
        return null;
      }

      if (
        resolvedIsFunction(
          item.webkitGetAsEntry
        )
      ) {
        return item
          .webkitGetAsEntry();
      }

      if (
        resolvedIsFunction(
          item.getAsEntry
        )
      ) {
        return item
          .getAsEntry();
      }

      return null;
    }

    async readEntry(
      entry,
      context = {}
    ) {
      if (
        !entry
      ) {
        return [];
      }

      const currentDepth =
        Math.max(
          0,
          resolvedSafeInteger(
            context.currentDepth,
            0
          )
        );

      if (
        currentDepth >
        this.maximumDepth
      ) {
        throw createDragDropError(
          `The dropped directory exceeds the supported depth of ${this.maximumDepth}.`,
          {
            code:
              DRAG_DROP_ERROR_CODE.DIRECTORY_READ_FAILED,

            details: {
              maximumDepth:
                this.maximumDepth,

              entryName:
                resolvedSafeString(
                  entry.name
                )
            }
          }
        );
      }

      this.discoveryCount +=
        1;

      this.assertDiscoveryLimit();

      if (
        entry.isFile
      ) {
        const file =
          await this.readFileEntry(
            entry
          );

        const parentPath =
          normalizeRelativePath(
            context.parentPath
          );

        const relativePath =
          normalizeRelativePath(
            [
              parentPath,
              file.name
            ]
              .filter(
                Boolean
              )
              .join("/")
          );

        attachRelativePath(
          file,
          relativePath
        );

        this.emit(
          DRAG_DROP_EVENTS.FILE_DISCOVERED,
          {
            file:
              createFileSummary(
                file
              )
          }
        );

        return [file];
      }

      if (
        entry.isDirectory
      ) {
        const directoryName =
          resolvedSafeString(
            entry.name
          );

        const nextParentPath =
          normalizeRelativePath(
            [
              context.parentPath,
              directoryName
            ]
              .filter(
                Boolean
              )
              .join("/")
          );

        this.emit(
          DRAG_DROP_EVENTS.DIRECTORY_READING,
          {
            name:
              directoryName,

            fullPath:
              normalizeRelativePath(
                entry.fullPath ||
                nextParentPath
              ),

            depth:
              currentDepth
          }
        );

        const childEntries =
          await this.readDirectoryEntries(
            entry
          );

        const childFileGroups =
          await Promise.all(
            childEntries.map(
              childEntry =>
                this.readEntry(
                  childEntry,
                  {
                    currentDepth:
                      currentDepth +
                      1,

                    parentPath:
                      nextParentPath
                  }
                )
            )
          );

        const files =
          childFileGroups.flat();

        this.emit(
          DRAG_DROP_EVENTS.DIRECTORY_READ,
          {
            name:
              directoryName,

            fullPath:
              normalizeRelativePath(
                entry.fullPath ||
                nextParentPath
              ),

            fileCount:
              files.length,

            depth:
              currentDepth
          }
        );

        return files;
      }

      return [];
    }

    readFileEntry(
      entry
    ) {
      return new Promise(
        (
          resolve,
          reject
        ) => {
          try {
            entry.file(
              file => {
                resolve(
                  file
                );
              },
              error => {
                reject(
                  createDragDropError(
                    `The file "${resolvedSafeString(entry.name, "untitled")}" could not be read.`,
                    {
                      code:
                        DRAG_DROP_ERROR_CODE.DIRECTORY_READ_FAILED,

                      cause:
                        error
                    }
                  )
                );
              }
            );
          } catch (
            fileReadError
          ) {
            reject(
              createDragDropError(
                `The file "${resolvedSafeString(entry.name, "untitled")}" could not be read.`,
                {
                  code:
                    DRAG_DROP_ERROR_CODE.DIRECTORY_READ_FAILED,

                  cause:
                    fileReadError
                }
              )
            );
          }
        }
      );
    }

    async readDirectoryEntries(
      directoryEntry
    ) {
      const reader =
        directoryEntry
          .createReader();

      const entries =
        [];

      while (
        true
      ) {
        const batch =
          await new Promise(
            (
              resolve,
              reject
            ) => {
              try {
                reader.readEntries(
                  resolve,
                  reject
                );
              } catch (
                readError
              ) {
                reject(
                  readError
                );
              }
            }
          );

        if (
          !batch ||
          !batch.length
        ) {
          break;
        }

        entries.push(
          ...batch
        );

        this.discoveryCount +=
          batch.length;

        this.assertDiscoveryLimit();

        if (
          batch.length <
          this.directoryReadBatchLimit
        ) {
          continue;
        }
      }

      return entries;
    }

    emit(
      eventName,
      payload = {}
    ) {
      if (
        this.eventBus &&
        resolvedIsFunction(
          this.eventBus.emit
        )
      ) {
        this.eventBus.emit(
          eventName,
          {
            ...payload,

            timestamp:
              nowIsoString()
          }
        );
      }
    }
  }

  /* =========================================================
     FILE SYSTEM ACCESS API READER
  ========================================================= */

  class FileSystemHandleReader {
    constructor(
      options = {}
    ) {
      this.maximumDepth =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumDepth,
            DEFAULT_MAXIMUM_DIRECTORY_DEPTH
          )
        );

      this.maximumDiscoveredItems =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumDiscoveredItems,
            DEFAULT_MAXIMUM_DISCOVERED_ITEMS
          )
        );

      this.eventBus =
        options.eventBus ||
        eventBus;

      this.discoveryCount =
        0;
    }

    reset() {
      this.discoveryCount =
        0;
    }

    assertDiscoveryLimit() {
      if (
        this.discoveryCount >
        this.maximumDiscoveredItems
      ) {
        throw createDragDropError(
          `The dropped content exceeds the discovery limit of ${this.maximumDiscoveredItems} items.`,
          {
            code:
              DRAG_DROP_ERROR_CODE.DISCOVERY_LIMIT_EXCEEDED
          }
        );
      }
    }

    async readItems(
      items,
      options = {}
    ) {
      this.reset();

      const files =
        [];

      const directories =
        [];

      const rejected =
        [];

      for (
        const item
        of Array.from(
          items ||
          []
        )
      ) {
        if (
          !isDataTransferFileItem(
            item
          ) ||
          !resolvedIsFunction(
            item.getAsFileSystemHandle
          )
        ) {
          continue;
        }

        try {
          const handle =
            await item
              .getAsFileSystemHandle();

          if (
            !handle
          ) {
            continue;
          }

          if (
            handle.kind ===
            "directory"
          ) {
            directories.push({
              name:
                resolvedSafeString(
                  handle.name
                )
            });

            if (
              options.allowDirectories ===
              false
            ) {
              rejected.push({
                type:
                  "directory",

                name:
                  resolvedSafeString(
                    handle.name
                  ),

                reason:
                  DROP_REJECTION_REASON.DIRECTORY_NOT_ALLOWED
              });

              continue;
            }
          }

          const discoveredFiles =
            await this.readHandle(
              handle,
              {
                depth:
                  0,

                parentPath:
                  ""
              }
            );

          files.push(
            ...discoveredFiles
          );
        } catch (
          handleError
        ) {
          rejected.push({
            type:
              "handle",

            reason:
              DROP_REJECTION_REASON.PROCESSING_FAILED,

            error:
              resolvedNormalizeError(
                handleError
              )
          });
        }
      }

      return {
        files,

        directories,

        rejected
      };
    }

    async readHandle(
      handle,
      context = {}
    ) {
      if (
        !handle
      ) {
        return [];
      }

      const depth =
        Math.max(
          0,
          resolvedSafeInteger(
            context.depth,
            0
          )
        );

      if (
        depth >
        this.maximumDepth
      ) {
        throw createDragDropError(
          `The dropped directory exceeds the supported depth of ${this.maximumDepth}.`,
          {
            code:
              DRAG_DROP_ERROR_CODE.DIRECTORY_READ_FAILED
          }
        );
      }

      this.discoveryCount +=
        1;

      this.assertDiscoveryLimit();

      if (
        handle.kind ===
        "file"
      ) {
        const file =
          await handle.getFile();

        const relativePath =
          normalizeRelativePath(
            [
              context.parentPath,
              file.name
            ]
              .filter(
                Boolean
              )
              .join("/")
          );

        attachRelativePath(
          file,
          relativePath
        );

        this.emit(
          DRAG_DROP_EVENTS.FILE_DISCOVERED,
          {
            file:
              createFileSummary(
                file
              )
          }
        );

        return [file];
      }

      if (
        handle.kind ===
        "directory"
      ) {
        const directoryName =
          resolvedSafeString(
            handle.name
          );

        const nextParentPath =
          normalizeRelativePath(
            [
              context.parentPath,
              directoryName
            ]
              .filter(
                Boolean
              )
              .join("/")
          );

        this.emit(
          DRAG_DROP_EVENTS.DIRECTORY_READING,
          {
            name:
              directoryName,

            fullPath:
              nextParentPath,

            depth
          }
        );

        const files =
          [];

        for await (
          const childHandle
          of handle.values()
        ) {
          const childFiles =
            await this.readHandle(
              childHandle,
              {
                depth:
                  depth +
                  1,

                parentPath:
                  nextParentPath
              }
            );

          files.push(
            ...childFiles
          );
        }

        this.emit(
          DRAG_DROP_EVENTS.DIRECTORY_READ,
          {
            name:
              directoryName,

            fullPath:
              nextParentPath,

            fileCount:
              files.length,

            depth
          }
        );

        return files;
      }

      return [];
    }

    emit(
      eventName,
      payload = {}
    ) {
      if (
        this.eventBus &&
        resolvedIsFunction(
          this.eventBus.emit
        )
      ) {
        this.eventBus.emit(
          eventName,
          {
            ...payload,

            timestamp:
              nowIsoString()
          }
        );
      }
    }
  }

  /* =========================================================
     DROP OVERLAY CONTROLLER
  ========================================================= */

  class DropOverlayController {
    constructor(
      options = {}
    ) {
      this.enabled =
        options.enabled !==
        false;

      this.overlayId =
        resolvedSafeString(
          options.overlayId,
          DEFAULT_OVERLAY_ID
        );

      this.overlayElement =
        null;

      this.visible =
        false;

      this.processing =
        false;

      this.rejected =
        false;

      this.eventBus =
        options.eventBus ||
        eventBus;

      this.ensureOverlay();
    }

    ensureOverlay() {
      if (
        !this.enabled
      ) {
        return null;
      }

      const existingElement =
        documentObject.getElementById(
          this.overlayId
        );

      if (
        existingElement
      ) {
        this.overlayElement =
          existingElement;

        return existingElement;
      }

      const overlayElement =
        documentObject.createElement(
          "div"
        );

      overlayElement.id =
        this.overlayId;

      overlayElement.className =
        "aift-media-drop-overlay";

      overlayElement.setAttribute(
        "aria-hidden",
        "true"
      );

      overlayElement.setAttribute(
        "role",
        "status"
      );

      overlayElement.innerHTML = `
        <div class="aift-media-drop-overlay__backdrop"></div>
        <div class="aift-media-drop-overlay__panel">
          <div class="aift-media-drop-overlay__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 16V4"></path>
              <path d="M7 9l5-5 5 5"></path>
              <path d="M5 20h14a2 2 0 0 0 2-2v-4"></path>
              <path d="M3 14v4a2 2 0 0 0 2 2"></path>
            </svg>
          </div>
          <div class="aift-media-drop-overlay__content">
            <strong class="aift-media-drop-overlay__title">Drop files to upload</strong>
            <span class="aift-media-drop-overlay__message">Release your files anywhere inside the Media Library.</span>
          </div>
        </div>
      `;

      documentObject.body
        .appendChild(
          overlayElement
        );

      this.overlayElement =
        overlayElement;

      return overlayElement;
    }

    setMessage(
      title,
      message
    ) {
      const overlay =
        this.ensureOverlay();

      if (
        !overlay
      ) {
        return;
      }

      const titleElement =
        overlay.querySelector(
          ".aift-media-drop-overlay__title"
        );

      const messageElement =
        overlay.querySelector(
          ".aift-media-drop-overlay__message"
        );

      if (
        titleElement
      ) {
        titleElement.textContent =
          resolvedSafeString(
            title,
            "Drop files to upload"
          );
      }

      if (
        messageElement
      ) {
        messageElement.textContent =
          resolvedSafeString(
            message,
            "Release your files anywhere inside the Media Library."
          );
      }
    }

    show(
      options = {}
    ) {
      if (
        !this.enabled
      ) {
        return;
      }

      const overlay =
        this.ensureOverlay();

      if (
        !overlay
      ) {
        return;
      }

      this.visible =
        true;

      this.processing =
        options.processing ===
        true;

      this.rejected =
        options.rejected ===
        true;

      overlay.classList.add(
        "is-visible"
      );

      overlay.classList.toggle(
        "is-processing",
        this.processing
      );

      overlay.classList.toggle(
        "is-rejected",
        this.rejected
      );

      overlay.setAttribute(
        "aria-hidden",
        "false"
      );

      this.setMessage(
        options.title,
        options.message
      );

      this.emit(
        DRAG_DROP_EVENTS.OVERLAY_SHOWN,
        {
          processing:
            this.processing,

          rejected:
            this.rejected
        }
      );
    }

    hide() {
      if (
        !this.overlayElement
      ) {
        return;
      }

      this.visible =
        false;

      this.processing =
        false;

      this.rejected =
        false;

      this.overlayElement
        .classList
        .remove(
          "is-visible",
          "is-processing",
          "is-rejected"
        );

      this.overlayElement.setAttribute(
        "aria-hidden",
        "true"
      );

      this.emit(
        DRAG_DROP_EVENTS.OVERLAY_HIDDEN,
        {}
      );
    }

    destroy() {
      if (
        this.overlayElement &&
        this.overlayElement.parentNode
      ) {
        this.overlayElement
          .parentNode
          .removeChild(
            this.overlayElement
          );
      }

      this.overlayElement =
        null;

      this.visible =
        false;
    }

    emit(
      eventName,
      payload = {}
    ) {
      if (
        this.eventBus &&
        resolvedIsFunction(
          this.eventBus.emit
        )
      ) {
        this.eventBus.emit(
          eventName,
          {
            ...payload,

            timestamp:
              nowIsoString()
          }
        );
      }
    }
  }

  /* =========================================================
     DRAG AND DROP ENGINE
  ========================================================= */

  class MediaDragDropEngine {
    constructor(
      options = {}
    ) {
      this.eventBus =
        options.eventBus ||
        eventBus;

      this.store =
        options.store ||
        store;

      this.notifications =
        options.notifications ||
        notifications;

      this.uploadManager =
        options.uploadManager ||
        uploadManager;

      this.uploadQueue =
        options.uploadQueue ||
        uploadQueue;

      this.enabled =
        options.enabled !==
        false;

      this.allowDirectories =
        options.allowDirectories !==
        false;

      this.allowPaste =
        options.allowPaste !==
        false;

      this.preventWindowFileNavigation =
        options.preventWindowFileNavigation !==
        false;

      this.overlayEnabled =
        options.overlayEnabled !==
        false;

      this.dropZoneRequired =
        options.dropZoneRequired ===
        true;

      this.autoStartUploads =
        options.autoStartUploads !==
        false;

      this.maximumFileCountPerDrop =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumFileCountPerDrop,
            DEFAULT_MAXIMUM_FILE_COUNT_PER_DROP
          )
        );

      this.maximumDirectoryDepth =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumDirectoryDepth,
            DEFAULT_MAXIMUM_DIRECTORY_DEPTH
          )
        );

      this.maximumDiscoveredItems =
        Math.max(
          1,
          resolvedSafeInteger(
            options.maximumDiscoveredItems,
            DEFAULT_MAXIMUM_DISCOVERED_ITEMS
          )
        );

      this.dragLeaveDelayMilliseconds =
        Math.max(
          0,
          resolvedSafeInteger(
            options.dragLeaveDelayMilliseconds,
            DEFAULT_DRAG_LEAVE_DELAY_MS
          )
        );

      this.dropEffect =
        normalizeDropEffect(
          options.dropEffect,
          "copy"
        );

      this.dragActiveClass =
        resolvedSafeString(
          options.dragActiveClass,
          DEFAULT_DRAG_ACTIVE_CLASS
        );

      this.dropReadyClass =
        resolvedSafeString(
          options.dropReadyClass,
          DEFAULT_DROP_READY_CLASS
        );

      this.dropRejectedClass =
        resolvedSafeString(
          options.dropRejectedClass,
          DEFAULT_DROP_REJECTED_CLASS
        );

      this.dropProcessingClass =
        resolvedSafeString(
          options.dropProcessingClass,
          DEFAULT_DROP_PROCESSING_CLASS
        );

      this.dropTargetSelectors =
        Array.from(
          new Set(
            [
              ...DEFAULT_DROP_TARGET_SELECTORS,
              ...resolvedNormalizeArray(
                options.dropTargetSelectors
              )
            ]
              .map(
                selector =>
                  resolvedSafeString(
                    selector
                  )
              )
              .filter(
                Boolean
              )
          )
        );

      this.additionalDropTargets =
        new Set();

      this.state =
        DRAG_DROP_STATE.IDLE;

      this.dragDepth =
        0;

      this.activeTarget =
        null;

      this.lastDropContext =
        null;

      this.lastResult =
        null;

      this.destroyed =
        false;

      this.processingPromise =
        null;

      this.dragLeaveTimer =
        null;

      this.dropSequence =
        0;

      this.directoryReader =
        new DirectoryEntryReader({
          maximumDepth:
            this.maximumDirectoryDepth,

          maximumDiscoveredItems:
            this.maximumDiscoveredItems,

          eventBus:
            this.eventBus
        });

      this.fileSystemHandleReader =
        new FileSystemHandleReader({
          maximumDepth:
            this.maximumDirectoryDepth,

          maximumDiscoveredItems:
            this.maximumDiscoveredItems,

          eventBus:
            this.eventBus
        });

      this.overlay =
        new DropOverlayController({
          enabled:
            this.overlayEnabled,

          eventBus:
            this.eventBus
        });

      this.boundHandleDragEnter =
        this.handleDragEnter
          .bind(this);

      this.boundHandleDragOver =
        this.handleDragOver
          .bind(this);

      this.boundHandleDragLeave =
        this.handleDragLeave
          .bind(this);

      this.boundHandleDrop =
        this.handleDrop
          .bind(this);

      this.boundHandleDragEnd =
        this.handleDragEnd
          .bind(this);

      this.boundHandlePaste =
        this.handlePaste
          .bind(this);

      this.boundPreventFileNavigation =
        this.preventFileNavigation
          .bind(this);

      this.debouncedResetDragState =
        resolvedDebounce(
          () => {
            this.resetDragState(
              "drag-leave"
            );
          },
          this.dragLeaveDelayMilliseconds
        );

      this.bindEvents();

      this.synchronizeStore(
        "drag-drop-engine-created"
      );
    }

    assertAvailable() {
      if (
        this.destroyed
      ) {
        throw createDragDropError(
          "The drag and drop engine has been destroyed.",
          {
            code:
              DRAG_DROP_ERROR_CODE.UNKNOWN
          }
        );
      }
    }

    bindEvents() {
      documentObject.addEventListener(
        "dragenter",
        this.boundHandleDragEnter,
        true
      );

      documentObject.addEventListener(
        "dragover",
        this.boundHandleDragOver,
        true
      );

      documentObject.addEventListener(
        "dragleave",
        this.boundHandleDragLeave,
        true
      );

      documentObject.addEventListener(
        "drop",
        this.boundHandleDrop,
        true
      );

      documentObject.addEventListener(
        "dragend",
        this.boundHandleDragEnd,
        true
      );

      if (
        this.allowPaste
      ) {
        documentObject.addEventListener(
          "paste",
          this.boundHandlePaste,
          true
        );
      }

      if (
        this.preventWindowFileNavigation
      ) {
        windowObject.addEventListener(
          "dragover",
          this.boundPreventFileNavigation,
          false
        );

        windowObject.addEventListener(
          "drop",
          this.boundPreventFileNavigation,
          false
        );
      }
    }

    preventFileNavigation(
      event
    ) {
      if (
        !this.enabled ||
        !hasFileTransferType(
          event?.dataTransfer
        )
      ) {
        return;
      }

      event.preventDefault();
    }

    enable() {
      this.assertAvailable();

      if (
        this.enabled
      ) {
        return this;
      }

      this.enabled =
        true;

      this.emit(
        DRAG_DROP_EVENTS.ENABLED,
        {}
      );

      this.synchronizeStore(
        "drag-drop-enabled"
      );

      return this;
    }

    disable() {
      this.assertAvailable();

      if (
        !this.enabled
      ) {
        return this;
      }

      this.enabled =
        false;

      this.resetDragState(
        "drag-drop-disabled"
      );

      this.emit(
        DRAG_DROP_EVENTS.DISABLED,
        {}
      );

      this.synchronizeStore(
        "drag-drop-disabled"
      );

      return this;
    }

    registerDropTarget(
      target
    ) {
      this.assertAvailable();

      let element =
        target;

      if (
        typeof target ===
        "string"
      ) {
        element =
          documentObject.querySelector(
            target
          );
      }

      if (
        !isElement(
          element
        )
      ) {
        throw createDragDropError(
          "The provided drop target is not a valid DOM element.",
          {
            code:
              DRAG_DROP_ERROR_CODE.INVALID_TARGET
          }
        );
      }

      this.additionalDropTargets.add(
        element
      );

      element.setAttribute(
        "data-aift-media-drop-zone",
        "true"
      );

      return () => {
        this.unregisterDropTarget(
          element
        );
      };
    }

    unregisterDropTarget(
      target
    ) {
      let element =
        target;

      if (
        typeof target ===
        "string"
      ) {
        element =
          documentObject.querySelector(
            target
          );
      }

      if (
        !isElement(
          element
        )
      ) {
        return false;
      }

      const removed =
        this.additionalDropTargets
          .delete(
            element
          );

      if (
        removed
      ) {
        element.removeAttribute(
          "data-aift-media-drop-zone"
        );
      }

      return removed;
    }

    resolveDropTarget(
      event
    ) {
      const eventTarget =
        resolveEventTargetElement(
          event
        );

      if (
        !eventTarget
      ) {
        return null;
      }

      for (
        const registeredTarget
        of this.additionalDropTargets
      ) {
        if (
          registeredTarget ===
            eventTarget ||
          registeredTarget.contains(
            eventTarget
          )
        ) {
          return registeredTarget;
        }
      }

      return findClosestMatchingTarget(
        eventTarget,
        this.dropTargetSelectors
      );
    }

    isTargetAllowed(
      targetElement
    ) {
      if (
        !this.dropZoneRequired
      ) {
        return true;
      }

      return Boolean(
        targetElement
      );
    }

    isFileDrag(
      event
    ) {
      return hasFileTransferType(
        event?.dataTransfer
      );
    }

    handleDragEnter(
      event
    ) {
      if (
        !this.enabled ||
        !this.isFileDrag(
          event
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      this.clearDragLeaveTimer();

      this.dragDepth +=
        1;

      const targetElement =
        this.resolveDropTarget(
          event
        );

      const targetAllowed =
        this.isTargetAllowed(
          targetElement
        );

      if (
        this.dragDepth ===
        1
      ) {
        this.setState(
          DRAG_DROP_STATE.ENTERING,
          "drag-enter"
        );
      }

      this.activeTarget =
        targetElement;

      this.applyDragClasses(
        targetElement,
        {
          active:
            true,

          ready:
            targetAllowed,

          rejected:
            !targetAllowed
        }
      );

      if (
        targetAllowed
      ) {
        this.setState(
          DRAG_DROP_STATE.ACTIVE,
          "drag-target-ready"
        );

        this.overlay.show({
          title:
            "Drop files to upload",

          message:
            this.allowDirectories
              ? "Release files or folders inside the Media Library."
              : "Release files inside the Media Library."
        });
      } else {
        this.setState(
          DRAG_DROP_STATE.REJECTED,
          "drag-target-rejected"
        );

        this.overlay.show({
          rejected:
            true,

          title:
            "Drop is not available here",

          message:
            "Move the files over an active Media Library drop area."
        });
      }

      if (
        event.dataTransfer
      ) {
        event.dataTransfer.dropEffect =
          targetAllowed
            ? this.dropEffect
            : "none";
      }

      this.emit(
        DRAG_DROP_EVENTS.DRAG_ENTER,
        {
          dragDepth:
            this.dragDepth,

          targetAllowed,

          context:
            buildDropContext(
              event,
              targetElement
            )
        }
      );
    }

    handleDragOver(
      event
    ) {
      if (
        !this.enabled ||
        !this.isFileDrag(
          event
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      this.clearDragLeaveTimer();

      const targetElement =
        this.resolveDropTarget(
          event
        );

      const targetAllowed =
        this.isTargetAllowed(
          targetElement
        );

      if (
        this.activeTarget !==
        targetElement
      ) {
        this.clearElementClasses(
          this.activeTarget
        );

        this.activeTarget =
          targetElement;
      }

      this.applyDragClasses(
        targetElement,
        {
          active:
            true,

          ready:
            targetAllowed,

          rejected:
            !targetAllowed
        }
      );

      if (
        event.dataTransfer
      ) {
        event.dataTransfer.dropEffect =
          targetAllowed
            ? this.dropEffect
            : "none";
      }

      this.setState(
        targetAllowed
          ? DRAG_DROP_STATE.ACTIVE
          : DRAG_DROP_STATE.REJECTED,
        "drag-over"
      );

      this.emit(
        DRAG_DROP_EVENTS.DRAG_OVER,
        {
          dragDepth:
            this.dragDepth,

          targetAllowed,

          context:
            buildDropContext(
              event,
              targetElement
            )
        }
      );
    }

    handleDragLeave(
      event
    ) {
      if (
        !this.enabled ||
        !this.isFileDrag(
          event
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      this.dragDepth =
        Math.max(
          0,
          this.dragDepth -
          1
        );

      this.emit(
        DRAG_DROP_EVENTS.DRAG_LEAVE,
        {
          dragDepth:
            this.dragDepth,

          context:
            buildDropContext(
              event,
              this.activeTarget
            )
        }
      );

      if (
        this.dragDepth ===
        0
      ) {
        this.clearDragLeaveTimer();

        this.dragLeaveTimer =
          windowObject.setTimeout(
            () => {
              this.dragLeaveTimer =
                null;

              this.resetDragState(
                "drag-left-document"
              );
            },
            this.dragLeaveDelayMilliseconds
          );
      }
    }

    handleDragEnd(
      event
    ) {
      if (
        !this.enabled
      ) {
        return;
      }

      this.resetDragState(
        "drag-ended"
      );

      this.emit(
        DRAG_DROP_EVENTS.DRAG_ENDED,
        {
          context:
            buildDropContext(
              event,
              this.activeTarget
            )
        }
      );
    }

    async handleDrop(
      event
    ) {
      if (
        !this.isFileDrag(
          event
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (
        !this.enabled
      ) {
        this.rejectDrop(
          event,
          DROP_REJECTION_REASON.ENGINE_DISABLED,
          createDragDropError(
            "Drag and drop uploads are currently disabled.",
            {
              code:
                DRAG_DROP_ERROR_CODE.ENGINE_DISABLED
            }
          )
        );

        return;
      }

      const targetElement =
        this.resolveDropTarget(
          event
        );

      const context =
        buildDropContext(
          event,
          targetElement
        );

      this.lastDropContext =
        context;

      this.emit(
        DRAG_DROP_EVENTS.DROP_RECEIVED,
        {
          context
        }
      );

      if (
        !this.isTargetAllowed(
          targetElement
        )
      ) {
        this.rejectDrop(
          event,
          DROP_REJECTION_REASON.TARGET_NOT_ALLOWED,
          createDragDropError(
            "Files cannot be dropped in this location.",
            {
              code:
                DRAG_DROP_ERROR_CODE.INVALID_TARGET
            }
          )
        );

        return;
      }

      if (
        this.processingPromise
      ) {
        await this.processingPromise;
      }

      this.processingPromise =
        this.processDrop(
          event,
          context
        );

      try {
        await this.processingPromise;
      } finally {
        this.processingPromise =
          null;
      }
    }

    async processDrop(
      event,
      context
    ) {
      this.setState(
        DRAG_DROP_STATE.PROCESSING,
        "drop-processing"
      );

      this.applyDragClasses(
        context.targetElement,
        {
          active:
            true,

          processing:
            true
        }
      );

      this.overlay.show({
        processing:
          true,

        title:
          "Preparing your files",

        message:
          "Scanning dropped files and folders before upload."
      });

      this.emit(
        DRAG_DROP_EVENTS.DROP_PROCESSING,
        {
          context
        }
      );

      try {
        const discoveryResult =
          await this.discoverDroppedContent(
            event.dataTransfer
          );

        const payloadType =
          resolveDropPayloadType(
            discoveryResult.files,
            discoveryResult.directories,
            event.dataTransfer
          );

        if (
          !discoveryResult.files.length
        ) {
          throw createDragDropError(
            "No uploadable files were found in the dropped content.",
            {
              code:
                DRAG_DROP_ERROR_CODE.NO_FILES,

              details: {
                payloadType,

                rejected:
                  discoveryResult.rejected
              }
            }
          );
        }

        if (
          discoveryResult.files.length >
          this.maximumFileCountPerDrop
        ) {
          throw createDragDropError(
            `A single drop can contain no more than ${this.maximumFileCountPerDrop} files.`,
            {
              code:
                DRAG_DROP_ERROR_CODE.TOO_MANY_FILES,

              details: {
                fileCount:
                  discoveryResult.files.length,

                maximumFileCount:
                  this.maximumFileCountPerDrop
              }
            }
          );
        }

        const acceptedPayload = {
          id:
            resolvedCreateId(
              "media-drop"
            ),

          sequence:
            ++this.dropSequence,

          payloadType,

          files:
            discoveryResult.files,

          directories:
            discoveryResult.directories,

          rejected:
            discoveryResult.rejected,

          context,

          receivedAt:
            nowIsoString()
        };

        this.emit(
          DRAG_DROP_EVENTS.DROP_ACCEPTED,
          {
            payload: {
              id:
                acceptedPayload.id,

              sequence:
                acceptedPayload.sequence,

              payloadType:
                acceptedPayload.payloadType,

              files:
                acceptedPayload.files.map(
                  createFileSummary
                ),

              directories:
                resolvedDeepClone(
                  acceptedPayload.directories
                ),

              rejected:
                resolvedDeepClone(
                  acceptedPayload.rejected
                ),

              context
            }
          }
        );

        const queueResult =
          await this.queueDiscoveredFiles(
            acceptedPayload
          );

        this.lastResult = {
          id:
            acceptedPayload.id,

          sequence:
            acceptedPayload.sequence,

          payloadType,

          fileCount:
            acceptedPayload.files.length,

          directoryCount:
            acceptedPayload.directories.length,

          addedCount:
            queueResult.added.length,

          rejectedCount:
            queueResult.rejected.length +
            acceptedPayload.rejected.length,

          added:
            queueResult.added.map(
              item =>
                item.toPublicJSON
                  ? item.toPublicJSON()
                  : resolvedDeepClone(
                      item
                    )
            ),

          rejected: [
            ...acceptedPayload.rejected,
            ...queueResult.rejected.map(
              rejection => ({
                file:
                  createFileSummary(
                    rejection.file
                  ),

                error:
                  resolvedDeepClone(
                    rejection.error
                  )
              })
            )
          ],

          context,

          completedAt:
            nowIsoString()
        };

        this.setState(
          DRAG_DROP_STATE.COMPLETED,
          "drop-completed"
        );

        this.emit(
          DRAG_DROP_EVENTS.FILES_QUEUED,
          {
            result:
              resolvedDeepClone(
                this.lastResult
              )
          }
        );

        this.emit(
          DRAG_DROP_EVENTS.DROP_COMPLETED,
          {
            result:
              resolvedDeepClone(
                this.lastResult
              )
          }
        );

        this.showDropCompletionNotification(
          this.lastResult
        );

        return this.lastResult;
      } catch (
        processingError
      ) {
        const normalizedError =
          resolvedNormalizeError(
            processingError,
            "The dropped content could not be processed."
          );

        this.lastResult = {
          failed:
            true,

          error:
            normalizedError,

          context,

          completedAt:
            nowIsoString()
        };

        this.setState(
          DRAG_DROP_STATE.REJECTED,
          "drop-failed"
        );

        this.emit(
          DRAG_DROP_EVENTS.DROP_FAILED,
          {
            error:
              normalizedError,

            context
          }
        );

        this.overlay.show({
          rejected:
            true,

          title:
            "Files could not be added",

          message:
            normalizedError.message
        });

        if (
          this.notifications &&
          resolvedIsFunction(
            this.notifications.error
          )
        ) {
          this.notifications.error(
            normalizedError.message,
            {
              title:
                "Upload failed",

              durationMilliseconds:
                6000
            }
          );
        }

        throw processingError;
      } finally {
        windowObject.setTimeout(
          () => {
            this.resetDragState(
              "drop-processing-finished"
            );
          },
          250
        );
      }
    }

    async discoverDroppedContent(
      dataTransfer
    ) {
      if (
        !dataTransfer
      ) {
        throw createDragDropError(
          "The drop event did not include transferable data.",
          {
            code:
              DRAG_DROP_ERROR_CODE.INVALID_EVENT
          }
        );
      }

      const transferItems =
        Array.from(
          dataTransfer.items ||
          []
        );

      if (
        transferItems.length
      ) {
        const supportsFileSystemHandles =
          transferItems.some(
            item =>
              resolvedIsFunction(
                item.getAsFileSystemHandle
              )
          );

        if (
          supportsFileSystemHandles
        ) {
          const handleResult =
            await this.fileSystemHandleReader
              .readItems(
                transferItems,
                {
                  allowDirectories:
                    this.allowDirectories
                }
              );

          if (
            handleResult.files.length ||
            handleResult.directories.length
          ) {
            return handleResult;
          }
        }

        const entryResult =
          await this.directoryReader
            .readDataTransferItems(
              transferItems,
              {
                allowDirectories:
                  this.allowDirectories
              }
            );

        if (
          entryResult.files.length ||
          entryResult.directories.length
        ) {
          return entryResult;
        }
      }

      const files =
        Array.from(
          dataTransfer.files ||
          []
        )
          .filter(
            file =>
              isFileObject(
                file
              ) ||
              isBlobObject(
                file
              )
          );

      return {
        files,

        directories:
          [],

        rejected:
          []
      };
    }

    async queueDiscoveredFiles(
      payload
    ) {
      const queueOptions = {
        source:
          uploadSources
            ?.DRAG_AND_DROP ||
          "drag-and-drop",

        classId:
          payload.context.classId,

        folderId:
          payload.context.folderId,

        autoStart:
          this.autoStartUploads,

        metadata: {
          drop: {
            id:
              payload.id,

            sequence:
              payload.sequence,

            payloadType:
              payload.payloadType,

            targetId:
              payload.context.targetId,

            targetRole:
              payload.context.targetRole,

            receivedAt:
              payload.receivedAt
          }
        }
      };

      const result =
        await this.uploadManager
          .addMany(
            payload.files,
            queueOptions
          );

      for (
        const rejection
        of result.rejected
      ) {
        this.emit(
          DRAG_DROP_EVENTS.FILE_REJECTED,
          {
            file:
              createFileSummary(
                rejection.file
              ),

            error:
              resolvedDeepClone(
                rejection.error
              ),

            context:
              payload.context
          }
        );
      }

      return result;
    }

    rejectDrop(
      event,
      reason,
      error
    ) {
      const targetElement =
        this.resolveDropTarget(
          event
        );

      const context =
        buildDropContext(
          event,
          targetElement
        );

      const normalizedError =
        resolvedNormalizeError(
          error,
          "The dropped content was rejected."
        );

      this.setState(
        DRAG_DROP_STATE.REJECTED,
        "drop-rejected"
      );

      this.applyDragClasses(
        targetElement,
        {
          active:
            true,

          rejected:
            true
        }
      );

      this.overlay.show({
        rejected:
          true,

        title:
          "Drop not accepted",

        message:
          normalizedError.message
      });

      this.emit(
        DRAG_DROP_EVENTS.DROP_REJECTED,
        {
          reason:
            resolvedSafeString(
              reason,
              DROP_REJECTION_REASON.PROCESSING_FAILED
            ),

          error:
            normalizedError,

          context
        }
      );

      windowObject.setTimeout(
        () => {
          this.resetDragState(
            "drop-rejection-finished"
          );
        },
        1000
      );
    }

    async handlePaste(
      event
    ) {
      if (
        !this.enabled ||
        !this.allowPaste
      ) {
        return;
      }

      const clipboardData =
        event.clipboardData;

      if (
        !clipboardData
      ) {
        return;
      }

      const files =
        Array.from(
          clipboardData.files ||
          []
        )
          .filter(
            file =>
              isFileObject(
                file
              ) ||
              isBlobObject(
                file
              )
          );

      if (
        !files.length
      ) {
        return;
      }

      event.preventDefault();

      const targetElement =
        this.resolveDropTarget(
          event
        );

      const context =
        buildDropContext(
          event,
          targetElement
        );

      context.source =
        uploadSources
          ?.PASTE ||
        "paste";

      this.emit(
        DRAG_DROP_EVENTS.PASTE_RECEIVED,
        {
          files:
            files.map(
              createFileSummary
            ),

          context
        }
      );

      try {
        const result =
          await this.uploadManager
            .addMany(
              files,
              {
                source:
                  uploadSources
                    ?.PASTE ||
                  "paste",

                classId:
                  context.classId,

                folderId:
                  context.folderId,

                autoStart:
                  this.autoStartUploads,

                metadata: {
                  paste: {
                    targetId:
                      context.targetId,

                    targetRole:
                      context.targetRole,

                    receivedAt:
                      nowIsoString()
                  }
                }
              }
            );

        this.emit(
          DRAG_DROP_EVENTS.PASTE_COMPLETED,
          {
            addedCount:
              result.added.length,

            rejectedCount:
              result.rejected.length,

            context
          }
        );

        this.showDropCompletionNotification({
          addedCount:
            result.added.length,

          rejectedCount:
            result.rejected.length,

          fileCount:
            files.length
        });
      } catch (
        pasteError
      ) {
        const normalizedError =
          resolvedNormalizeError(
            pasteError,
            "Pasted files could not be added."
          );

        this.emit(
          DRAG_DROP_EVENTS.DROP_FAILED,
          {
            source:
              "paste",

            error:
              normalizedError,

            context
          }
        );

        if (
          this.notifications &&
          resolvedIsFunction(
            this.notifications.error
          )
        ) {
          this.notifications.error(
            normalizedError.message,
            {
              title:
                "Paste upload failed"
            }
          );
        }
      }
    }

    showDropCompletionNotification(
      result
    ) {
      const addedCount =
        Math.max(
          0,
          resolvedSafeInteger(
            result.addedCount,
            0
          )
        );

      const rejectedCount =
        Math.max(
          0,
          resolvedSafeInteger(
            result.rejectedCount,
            0
          )
        );

      if (
        !this.notifications
      ) {
        return;
      }

      if (
        addedCount &&
        !rejectedCount &&
        resolvedIsFunction(
          this.notifications.success
        )
      ) {
        this.notifications.success(
          `${addedCount} file${addedCount === 1 ? "" : "s"} added to the upload queue.`,
          {
            title:
              "Files ready to upload",

            durationMilliseconds:
              4000
          }
        );

        return;
      }

      if (
        addedCount &&
        rejectedCount &&
        resolvedIsFunction(
          this.notifications.warning
        )
      ) {
        this.notifications.warning(
          `${addedCount} file${addedCount === 1 ? "" : "s"} added and ${rejectedCount} rejected.`,
          {
            title:
              "Upload queue updated",

            durationMilliseconds:
              6000
          }
        );

        return;
      }

      if (
        !addedCount &&
        rejectedCount &&
        resolvedIsFunction(
          this.notifications.error
        )
      ) {
        this.notifications.error(
          `${rejectedCount} file${rejectedCount === 1 ? " was" : "s were"} rejected.`,
          {
            title:
              "No files added",

            durationMilliseconds:
              6000
          }
        );
      }
    }

    applyDragClasses(
      targetElement,
      options = {}
    ) {
      documentObject.documentElement
        .classList
        .toggle(
          this.dragActiveClass,
          options.active ===
          true
        );

      if (
        !targetElement
      ) {
        return;
      }

      targetElement.classList.toggle(
        this.dragActiveClass,
        options.active ===
        true
      );

      targetElement.classList.toggle(
        this.dropReadyClass,
        options.ready ===
        true
      );

      targetElement.classList.toggle(
        this.dropRejectedClass,
        options.rejected ===
        true
      );

      targetElement.classList.toggle(
        this.dropProcessingClass,
        options.processing ===
        true
      );
    }

    clearElementClasses(
      element
    ) {
      if (
        !element
      ) {
        return;
      }

      element.classList.remove(
        this.dragActiveClass,
        this.dropReadyClass,
        this.dropRejectedClass,
        this.dropProcessingClass
      );
    }

    clearDragLeaveTimer() {
      if (
        this.dragLeaveTimer
      ) {
        windowObject.clearTimeout(
          this.dragLeaveTimer
        );

        this.dragLeaveTimer =
          null;
      }
    }

    resetDragState(
      reason =
        "drag-state-reset"
    ) {
      this.clearDragLeaveTimer();

      this.clearElementClasses(
        this.activeTarget
      );

      documentObject.documentElement
        .classList
        .remove(
          this.dragActiveClass,
          this.dropReadyClass,
          this.dropRejectedClass,
          this.dropProcessingClass
        );

      this.overlay.hide();

      this.dragDepth =
        0;

      this.activeTarget =
        null;

      if (
        this.state !==
        DRAG_DROP_STATE.DESTROYED
      ) {
        this.setState(
          DRAG_DROP_STATE.IDLE,
          reason
        );
      }
    }

    setState(
      nextState,
      reason
    ) {
      const normalizedNextState =
        normalizeState(
          nextState
        );

      const previousState =
        this.state;

      if (
        previousState ===
        normalizedNextState
      ) {
        return;
      }

      this.state =
        normalizedNextState;

      this.synchronizeStore(
        reason
      );

      this.emit(
        DRAG_DROP_EVENTS.STATE_CHANGED,
        {
          previousState,

          state:
            normalizedNextState,

          reason:
            resolvedSafeString(
              reason
            )
        }
      );
    }

    getSnapshot() {
      return {
        version:
          DRAG_DROP_ENGINE_VERSION,

        enabled:
          this.enabled,

        state:
          this.state,

        dragDepth:
          this.dragDepth,

        activeTargetId:
          resolvedSafeString(
            this.activeTarget?.id
          ),

        allowDirectories:
          this.allowDirectories,

        allowPaste:
          this.allowPaste,

        autoStartUploads:
          this.autoStartUploads,

        maximumFileCountPerDrop:
          this.maximumFileCountPerDrop,

        maximumDirectoryDepth:
          this.maximumDirectoryDepth,

        maximumDiscoveredItems:
          this.maximumDiscoveredItems,

        processing:
          Boolean(
            this.processingPromise
          ),

        lastDropContext:
          this.lastDropContext
            ? {
                ...this.lastDropContext,

                targetElement:
                  undefined
              }
            : null,

        lastResult:
          this.lastResult
            ? resolvedDeepClone(
                this.lastResult
              )
            : null
      };
    }

    synchronizeStore(
      reason
    ) {
      if (
        !this.store ||
        !resolvedIsFunction(
          this.store.setState
        )
      ) {
        return;
      }

      this.store.setState(
        {
          dragDrop: {
            initialized:
              true,

            version:
              DRAG_DROP_ENGINE_VERSION,

            enabled:
              this.enabled,

            state:
              this.state,

            dragDepth:
              this.dragDepth,

            activeTargetId:
              resolvedSafeString(
                this.activeTarget?.id
              ),

            allowDirectories:
              this.allowDirectories,

            allowPaste:
              this.allowPaste,

            autoStartUploads:
              this.autoStartUploads,

            processing:
              Boolean(
                this.processingPromise
              ),

            lastDropAt:
              this.lastResult
                ?.completedAt ||
              null
          }
        },
        {
          reason:
            resolvedSafeString(
              reason,
              "drag-drop-synchronized"
            )
        }
      );
    }

    emit(
      eventName,
      payload = {}
    ) {
      if (
        this.eventBus &&
        resolvedIsFunction(
          this.eventBus.emit
        )
      ) {
        this.eventBus.emit(
          eventName,
          {
            ...payload,

            timestamp:
              nowIsoString()
          }
        );
      }
    }

    destroy() {
      if (
        this.destroyed
      ) {
        return;
      }

      this.enabled =
        false;

      documentObject.removeEventListener(
        "dragenter",
        this.boundHandleDragEnter,
        true
      );

      documentObject.removeEventListener(
        "dragover",
        this.boundHandleDragOver,
        true
      );

      documentObject.removeEventListener(
        "dragleave",
        this.boundHandleDragLeave,
        true
      );

      documentObject.removeEventListener(
        "drop",
        this.boundHandleDrop,
        true
      );

      documentObject.removeEventListener(
        "dragend",
        this.boundHandleDragEnd,
        true
      );

      documentObject.removeEventListener(
        "paste",
        this.boundHandlePaste,
        true
      );

      windowObject.removeEventListener(
        "dragover",
        this.boundPreventFileNavigation,
        false
      );

      windowObject.removeEventListener(
        "drop",
        this.boundPreventFileNavigation,
        false
      );

      this.resetDragState(
        "drag-drop-destroyed"
      );

      this.additionalDropTargets
        .clear();

      this.overlay.destroy();

      this.processingPromise =
        null;

      this.lastDropContext =
        null;

      this.lastResult =
        null;

      this.destroyed =
        true;

      this.state =
        DRAG_DROP_STATE.DESTROYED;

      this.synchronizeStore(
        "drag-drop-destroyed"
      );
    }
  }

  /* =========================================================
     ENGINE CONFIGURATION
  ========================================================= */

  function resolveDragDropConfiguration() {
    const rootConfiguration =
      mediaLibrary.configuration ||
      application.configuration ||
      {};

    const uploadConfiguration =
      resolvedIsObject(
        rootConfiguration.upload
      )
        ? rootConfiguration.upload
        : {};

    const dragDropConfiguration =
      resolvedIsObject(
        uploadConfiguration.dragDrop
      )
        ? uploadConfiguration.dragDrop
        : {};

    return {
      enabled:
        dragDropConfiguration.enabled !==
        false,

      allowDirectories:
        dragDropConfiguration.allowDirectories !==
        false,

      allowPaste:
        dragDropConfiguration.allowPaste !==
        false,

      preventWindowFileNavigation:
        dragDropConfiguration.preventWindowFileNavigation !==
        false,

      overlayEnabled:
        dragDropConfiguration.overlayEnabled !==
        false,

      dropZoneRequired:
        dragDropConfiguration.dropZoneRequired ===
        true,

      autoStartUploads:
        dragDropConfiguration.autoStartUploads !==
        false,

      maximumFileCountPerDrop:
        Math.max(
          1,
          resolvedSafeInteger(
            dragDropConfiguration.maximumFileCountPerDrop,
            DEFAULT_MAXIMUM_FILE_COUNT_PER_DROP
          )
        ),

      maximumDirectoryDepth:
        Math.max(
          1,
          resolvedSafeInteger(
            dragDropConfiguration.maximumDirectoryDepth,
            DEFAULT_MAXIMUM_DIRECTORY_DEPTH
          )
        ),

      maximumDiscoveredItems:
        Math.max(
          1,
          resolvedSafeInteger(
            dragDropConfiguration.maximumDiscoveredItems,
            DEFAULT_MAXIMUM_DISCOVERED_ITEMS
          )
        ),

      dragLeaveDelayMilliseconds:
        Math.max(
          0,
          resolvedSafeInteger(
            dragDropConfiguration.dragLeaveDelayMilliseconds,
            DEFAULT_DRAG_LEAVE_DELAY_MS
          )
        ),

      dropEffect:
        normalizeDropEffect(
          dragDropConfiguration.dropEffect,
          "copy"
        ),

      dragActiveClass:
        resolvedSafeString(
          dragDropConfiguration.dragActiveClass,
          DEFAULT_DRAG_ACTIVE_CLASS
        ),

      dropReadyClass:
        resolvedSafeString(
          dragDropConfiguration.dropReadyClass,
          DEFAULT_DROP_READY_CLASS
        ),

      dropRejectedClass:
        resolvedSafeString(
          dragDropConfiguration.dropRejectedClass,
          DEFAULT_DROP_REJECTED_CLASS
        ),

      dropProcessingClass:
        resolvedSafeString(
          dragDropConfiguration.dropProcessingClass,
          DEFAULT_DROP_PROCESSING_CLASS
        ),

      dropTargetSelectors:
        resolvedNormalizeArray(
          dragDropConfiguration.dropTargetSelectors
        )
    };
  }

  const dragDropConfiguration =
    resolveDragDropConfiguration();

  const dragDropEngine =
    new MediaDragDropEngine({
      ...dragDropConfiguration,

      eventBus,

      store,

      notifications,

      uploadManager,

      uploadQueue
    });

  /* =========================================================
     APPLICATION CLEANUP INTEGRATION
  ========================================================= */

  if (
    application &&
    resolvedIsFunction(
      application.registerCleanup
    )
  ) {
    application.registerCleanup(
      () => {
        dragDropEngine.destroy();
      }
    );
  }

  /* =========================================================
     PUBLIC DRAG AND DROP INTERFACE
  ========================================================= */

  const dragDropPublicInterface = {
    version:
      DRAG_DROP_ENGINE_VERSION,

    states:
      DRAG_DROP_STATE,

    payloadTypes:
      DROP_PAYLOAD_TYPE,

    rejectionReasons:
      DROP_REJECTION_REASON,

    errorCodes:
      DRAG_DROP_ERROR_CODE,

    events:
      DRAG_DROP_EVENTS,

    configuration:
      dragDropConfiguration,

    engine:
      dragDropEngine,

    classes: {
      DirectoryEntryReader,

      FileSystemHandleReader,

      DropOverlayController,

      MediaDragDropEngine
    },

    enable() {
      return dragDropEngine.enable();
    },

    disable() {
      return dragDropEngine.disable();
    },

    registerDropTarget(
      target
    ) {
      return dragDropEngine
        .registerDropTarget(
          target
        );
    },

    unregisterDropTarget(
      target
    ) {
      return dragDropEngine
        .unregisterDropTarget(
          target
        );
    },

    processDrop(
      event,
      context
    ) {
      return dragDropEngine
        .processDrop(
          event,
          context
        );
    },

    getSnapshot() {
      return dragDropEngine
        .getSnapshot();
    },

    destroy() {
      return dragDropEngine
        .destroy();
    }
  };

  /* =========================================================
     CORE INTERFACE EXTENSION
  ========================================================= */

  uploads.dragDrop =
    dragDropPublicInterface;

  mediaLibrary.dragDrop =
    dragDropPublicInterface;

  mediaLibrary.dragDropEngine =
    dragDropEngine;

  mediaLibrary.dragDropEvents =
    DRAG_DROP_EVENTS;

  mediaLibrary.dragDropStates =
    DRAG_DROP_STATE;

  mediaLibrary.dropPayloadTypes =
    DROP_PAYLOAD_TYPE;

  mediaLibrary.classes = {
    ...mediaLibrary.classes,

    DirectoryEntryReader,

    FileSystemHandleReader,

    DropOverlayController,

    MediaDragDropEngine
  };

  mediaLibrary.enableMediaDragDrop =
    function enableMediaDragDrop() {
      return dragDropEngine.enable();
    };

  mediaLibrary.disableMediaDragDrop =
    function disableMediaDragDrop() {
      return dragDropEngine.disable();
    };

  mediaLibrary.registerMediaDropTarget =
    function registerMediaDropTarget(
      target
    ) {
      return dragDropEngine
        .registerDropTarget(
          target
        );
    };

  mediaLibrary.unregisterMediaDropTarget =
    function unregisterMediaDropTarget(
      target
    ) {
      return dragDropEngine
        .unregisterDropTarget(
          target
        );
    };

  mediaLibrary.getMediaDragDropSnapshot =
    function getMediaDragDropSnapshot() {
      return dragDropEngine
        .getSnapshot();
    };

  mediaLibrary.__dragDropEngineInitialized =
    true;

  /* =========================================================
     ENGINE READY EVENT
  ========================================================= */

  eventBus.emit(
    DRAG_DROP_EVENTS.INITIALIZED,
    {
      version:
        DRAG_DROP_ENGINE_VERSION,

      configuration:
        resolvedDeepClone(
          dragDropConfiguration
        ),

      snapshot:
        dragDropEngine
          .getSnapshot(),

      timestamp:
        nowIsoString()
    }
  );
})(
  window,
  document
);
/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2E OF 15
   FILE VALIDATION ENGINE
========================================================= */

(function initializeAIFTMediaValidationEngine(global) {
  "use strict";

  const mediaLibrary = global.AIFTMediaLibrary;

  if (!mediaLibrary) {
    throw new Error(
      "AIFTMediaLibrary must be initialized before loading Part 2E."
    );
  }

  if (mediaLibrary.__fileValidationEngineInitialized) {
    return;
  }

  const uploads = mediaLibrary.uploads || (mediaLibrary.uploads = {});
  const eventBus = mediaLibrary.events || mediaLibrary.eventBus || null;
  const store = mediaLibrary.store || null;
  const notifications = mediaLibrary.notifications || null;

  /* =========================================================
     VALIDATION CONSTANTS
  ========================================================= */

  const VALIDATION_SEVERITY = Object.freeze({
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical"
  });

  const VALIDATION_STATUS = Object.freeze({
    PENDING: "pending",
    RUNNING: "running",
    VALID: "valid",
    INVALID: "invalid",
    WARNING: "warning",
    CANCELLED: "cancelled",
    FAILED: "failed"
  });

  const VALIDATION_STAGE = Object.freeze({
    BASIC: "basic",
    NAME: "name",
    EXTENSION: "extension",
    MIME: "mime",
    SIGNATURE: "signature",
    SIZE: "size",
    DIMENSIONS: "dimensions",
    DURATION: "duration",
    DUPLICATE: "duplicate",
    SECURITY: "security",
    CUSTOM: "custom",
    COMPLETE: "complete"
  });

  const FILE_CATEGORY = Object.freeze({
    IMAGE: "image",
    VIDEO: "video",
    AUDIO: "audio",
    DOCUMENT: "document",
    ARCHIVE: "archive",
    FONT: "font",
    TEXT: "text",
    PRESENTATION: "presentation",
    SPREADSHEET: "spreadsheet",
    UNKNOWN: "unknown"
  });

  const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
  const DEFAULT_MIN_FILE_SIZE = 1;
  const DEFAULT_BATCH_CONCURRENCY = 4;
  const DEFAULT_CACHE_TTL = 15 * 60 * 1000;
  const DEFAULT_SIGNATURE_BYTES = 32;
  const DEFAULT_FILENAME_LENGTH = 255;

  const RESERVED_WINDOWS_NAMES = new Set([
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9"
  ]);

  const DANGEROUS_EXTENSIONS = new Set([
    "ade",
    "adp",
    "apk",
    "app",
    "application",
    "bat",
    "bin",
    "cab",
    "chm",
    "cmd",
    "com",
    "cpl",
    "crt",
    "dll",
    "dmg",
    "exe",
    "gadget",
    "hta",
    "inf",
    "ins",
    "iso",
    "isp",
    "jar",
    "js",
    "jse",
    "lnk",
    "mde",
    "msc",
    "msi",
    "msp",
    "mst",
    "nsh",
    "pif",
    "pkg",
    "ps1",
    "reg",
    "scr",
    "sct",
    "sh",
    "sys",
    "vb",
    "vbe",
    "vbs",
    "vxd",
    "ws",
    "wsc",
    "wsf",
    "wsh"
  ]);

  const MIME_CATEGORY_MAP = Object.freeze({
    "image/": FILE_CATEGORY.IMAGE,
    "video/": FILE_CATEGORY.VIDEO,
    "audio/": FILE_CATEGORY.AUDIO,
    "text/": FILE_CATEGORY.TEXT,
    "font/": FILE_CATEGORY.FONT
  });

  const DOCUMENT_MIME_TYPES = new Set([
    "application/pdf",
    "application/rtf",
    "application/msword",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]);

  const PRESENTATION_MIME_TYPES = new Set([
    "application/vnd.ms-powerpoint",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ]);

  const SPREADSHEET_MIME_TYPES = new Set([
    "application/vnd.ms-excel",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ]);

  const ARCHIVE_MIME_TYPES = new Set([
    "application/zip",
    "application/x-7z-compressed",
    "application/x-rar-compressed",
    "application/vnd.rar",
    "application/gzip",
    "application/x-gzip",
    "application/x-tar",
    "application/x-bzip2"
  ]);

  const EXTENSION_MIME_MAP = Object.freeze({
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    jpe: ["image/jpeg"],
    png: ["image/png"],
    gif: ["image/gif"],
    webp: ["image/webp"],
    avif: ["image/avif"],
    bmp: ["image/bmp"],
    tif: ["image/tiff"],
    tiff: ["image/tiff"],
    svg: ["image/svg+xml"],
    ico: ["image/x-icon", "image/vnd.microsoft.icon"],
    heic: ["image/heic", "image/heif"],
    heif: ["image/heif", "image/heic"],

    mp4: ["video/mp4"],
    m4v: ["video/mp4", "video/x-m4v"],
    mov: ["video/quicktime"],
    webm: ["video/webm"],
    mkv: ["video/x-matroska"],
    avi: ["video/x-msvideo"],
    mpg: ["video/mpeg"],
    mpeg: ["video/mpeg"],
    ogv: ["video/ogg"],

    mp3: ["audio/mpeg"],
    wav: ["audio/wav", "audio/x-wav"],
    ogg: ["audio/ogg", "application/ogg"],
    oga: ["audio/ogg"],
    m4a: ["audio/mp4", "audio/x-m4a"],
    aac: ["audio/aac"],
    flac: ["audio/flac"],
    opus: ["audio/opus"],

    pdf: ["application/pdf"],
    txt: ["text/plain"],
    md: ["text/markdown", "text/plain"],
    csv: ["text/csv", "application/csv", "text/plain"],
    json: ["application/json", "text/json", "text/plain"],
    xml: ["application/xml", "text/xml", "text/plain"],
    rtf: ["application/rtf", "text/rtf"],

    doc: ["application/msword"],
    docx: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    odt: ["application/vnd.oasis.opendocument.text"],

    xls: ["application/vnd.ms-excel"],
    xlsx: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
    ods: ["application/vnd.oasis.opendocument.spreadsheet"],

    ppt: ["application/vnd.ms-powerpoint"],
    pptx: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    odp: ["application/vnd.oasis.opendocument.presentation"],

    zip: ["application/zip", "application/x-zip-compressed"],
    rar: ["application/vnd.rar", "application/x-rar-compressed"],
    "7z": ["application/x-7z-compressed"],
    gz: ["application/gzip", "application/x-gzip"],
    tar: ["application/x-tar"],

    woff: ["font/woff", "application/font-woff"],
    woff2: ["font/woff2"],
    ttf: ["font/ttf", "application/x-font-ttf"],
    otf: ["font/otf", "application/x-font-opentype"]
  });

  const FILE_SIGNATURES = Object.freeze([
    {
      name: "jpeg",
      mime: "image/jpeg",
      extensions: ["jpg", "jpeg", "jpe"],
      offset: 0,
      bytes: [0xff, 0xd8, 0xff]
    },
    {
      name: "png",
      mime: "image/png",
      extensions: ["png"],
      offset: 0,
      bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    },
    {
      name: "gif87a",
      mime: "image/gif",
      extensions: ["gif"],
      offset: 0,
      ascii: "GIF87a"
    },
    {
      name: "gif89a",
      mime: "image/gif",
      extensions: ["gif"],
      offset: 0,
      ascii: "GIF89a"
    },
    {
      name: "webp",
      mime: "image/webp",
      extensions: ["webp"],
      offset: 0,
      matcher(bytes) {
        return (
          bytes.length >= 12 &&
          readAscii(bytes, 0, 4) === "RIFF" &&
          readAscii(bytes, 8, 4) === "WEBP"
        );
      }
    },
    {
      name: "bmp",
      mime: "image/bmp",
      extensions: ["bmp"],
      offset: 0,
      ascii: "BM"
    },
    {
      name: "tiff-little-endian",
      mime: "image/tiff",
      extensions: ["tif", "tiff"],
      offset: 0,
      bytes: [0x49, 0x49, 0x2a, 0x00]
    },
    {
      name: "tiff-big-endian",
      mime: "image/tiff",
      extensions: ["tif", "tiff"],
      offset: 0,
      bytes: [0x4d, 0x4d, 0x00, 0x2a]
    },
    {
      name: "pdf",
      mime: "application/pdf",
      extensions: ["pdf"],
      offset: 0,
      ascii: "%PDF-"
    },
    {
      name: "zip",
      mime: "application/zip",
      extensions: ["zip", "docx", "xlsx", "pptx", "odt", "ods", "odp"],
      offset: 0,
      matcher(bytes) {
        if (bytes.length < 4) {
          return false;
        }

        return (
          bytes[0] === 0x50 &&
          bytes[1] === 0x4b &&
          (
            (bytes[2] === 0x03 && bytes[3] === 0x04) ||
            (bytes[2] === 0x05 && bytes[3] === 0x06) ||
            (bytes[2] === 0x07 && bytes[3] === 0x08)
          )
        );
      }
    },
    {
      name: "rar4",
      mime: "application/vnd.rar",
      extensions: ["rar"],
      offset: 0,
      bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]
    },
    {
      name: "rar5",
      mime: "application/vnd.rar",
      extensions: ["rar"],
      offset: 0,
      bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00]
    },
    {
      name: "7zip",
      mime: "application/x-7z-compressed",
      extensions: ["7z"],
      offset: 0,
      bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]
    },
    {
      name: "gzip",
      mime: "application/gzip",
      extensions: ["gz"],
      offset: 0,
      bytes: [0x1f, 0x8b]
    },
    {
      name: "mp3-id3",
      mime: "audio/mpeg",
      extensions: ["mp3"],
      offset: 0,
      ascii: "ID3"
    },
    {
      name: "mp3-frame",
      mime: "audio/mpeg",
      extensions: ["mp3"],
      offset: 0,
      matcher(bytes) {
        return (
          bytes.length >= 2 &&
          bytes[0] === 0xff &&
          (bytes[1] & 0xe0) === 0xe0
        );
      }
    },
    {
      name: "wav",
      mime: "audio/wav",
      extensions: ["wav"],
      offset: 0,
      matcher(bytes) {
        return (
          bytes.length >= 12 &&
          readAscii(bytes, 0, 4) === "RIFF" &&
          readAscii(bytes, 8, 4) === "WAVE"
        );
      }
    },
    {
      name: "ogg",
      mime: "application/ogg",
      extensions: ["ogg", "oga", "ogv", "opus"],
      offset: 0,
      ascii: "OggS"
    },
    {
      name: "flac",
      mime: "audio/flac",
      extensions: ["flac"],
      offset: 0,
      ascii: "fLaC"
    },
    {
      name: "avi",
      mime: "video/x-msvideo",
      extensions: ["avi"],
      offset: 0,
      matcher(bytes) {
        return (
          bytes.length >= 12 &&
          readAscii(bytes, 0, 4) === "RIFF" &&
          readAscii(bytes, 8, 4) === "AVI "
        );
      }
    },
    {
      name: "matroska-webm",
      mime: "video/x-matroska",
      extensions: ["mkv", "webm"],
      offset: 0,
      bytes: [0x1a, 0x45, 0xdf, 0xa3]
    },
    {
      name: "mp4-family",
      mime: "video/mp4",
      extensions: ["mp4", "m4v", "m4a", "mov", "heic", "heif", "avif"],
      offset: 4,
      ascii: "ftyp"
    }
  ]);

  const DEFAULT_PROFILE = Object.freeze({
    id: "default",
    label: "Default media validation",
    enabled: true,
    allowEmptyFiles: false,
    minFileSize: DEFAULT_MIN_FILE_SIZE,
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    maxFilenameLength: DEFAULT_FILENAME_LENGTH,
    allowedCategories: [
      FILE_CATEGORY.IMAGE,
      FILE_CATEGORY.VIDEO,
      FILE_CATEGORY.AUDIO,
      FILE_CATEGORY.DOCUMENT,
      FILE_CATEGORY.PRESENTATION,
      FILE_CATEGORY.SPREADSHEET,
      FILE_CATEGORY.TEXT
    ],
    blockedCategories: [
      FILE_CATEGORY.ARCHIVE,
      FILE_CATEGORY.FONT
    ],
    allowedMimeTypes: [],
    blockedMimeTypes: [],
    allowedExtensions: [],
    blockedExtensions: Array.from(DANGEROUS_EXTENSIONS),
    requireKnownExtension: false,
    requireKnownMimeType: false,
    requireSignatureMatch: false,
    rejectMimeMismatch: true,
    rejectExtensionMismatch: true,
    rejectDangerousExtensions: true,
    rejectDoubleExtensions: true,
    rejectHiddenFiles: false,
    rejectReservedNames: true,
    sanitizeFilename: true,
    normalizeUnicode: true,
    duplicatePolicy: "warning",
    maxImageWidth: 16384,
    maxImageHeight: 16384,
    minImageWidth: 1,
    minImageHeight: 1,
    maxImagePixels: 100000000,
    minVideoWidth: 1,
    minVideoHeight: 1,
    maxVideoWidth: 16384,
    maxVideoHeight: 16384,
    maxDurationSeconds: 24 * 60 * 60,
    minDurationSeconds: 0,
    validateDimensions: true,
    validateDuration: true,
    enableSignatureInspection: true,
    enableDuplicateInspection: true,
    enableSecurityHooks: true,
    failOnHookError: false,
    customRules: []
  });

  /* =========================================================
     UTILITY FUNCTIONS
  ========================================================= */

  function now() {
    return Date.now();
  }

  function createId(prefix) {
    const random =
      global.crypto && typeof global.crypto.randomUUID === "function"
        ? global.crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    return `${prefix || "validation"}_${random}`;
  }

  function isFile(value) {
    return typeof File !== "undefined" && value instanceof File;
  }

  function isBlob(value) {
    return typeof Blob !== "undefined" && value instanceof Blob;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeMime(value) {
    return normalizeString(value).toLowerCase().split(";")[0].trim();
  }

  function getFileExtension(filename) {
    const value = normalizeString(filename);
    const index = value.lastIndexOf(".");

    if (index <= 0 || index === value.length - 1) {
      return "";
    }

    return value.slice(index + 1).toLowerCase();
  }

  function getFilenameBase(filename) {
    const value = normalizeString(filename);
    const index = value.lastIndexOf(".");

    if (index <= 0) {
      return value;
    }

    return value.slice(0, index);
  }

  function hasDoubleExtension(filename) {
    const value = normalizeString(filename).toLowerCase();
    const parts = value.split(".").filter(Boolean);

    if (parts.length < 3) {
      return false;
    }

    const finalExtension = parts[parts.length - 1];
    const previousExtension = parts[parts.length - 2];

    return (
      DANGEROUS_EXTENSIONS.has(finalExtension) ||
      DANGEROUS_EXTENSIONS.has(previousExtension)
    );
  }

  function isHiddenFilename(filename) {
    const value = normalizeString(filename);

    return value.startsWith(".") && value !== "." && value !== "..";
  }

  function isReservedFilename(filename) {
    const base = getFilenameBase(filename)
      .replace(/[.\s]+$/g, "")
      .toUpperCase();

    return RESERVED_WINDOWS_NAMES.has(base);
  }

  function sanitizeFilename(filename, options) {
    const config = options || {};
    const normalizeUnicode = config.normalizeUnicode !== false;
    const maxLength = Number.isFinite(config.maxLength)
      ? Math.max(1, config.maxLength)
      : DEFAULT_FILENAME_LENGTH;

    let value = normalizeString(filename);

    if (normalizeUnicode && typeof value.normalize === "function") {
      value = value.normalize("NFKC");
    }

    value = value
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, " ")
      .replace(/[.\s]+$/g, "")
      .trim();

    if (!value) {
      value = "untitled";
    }

    if (isReservedFilename(value)) {
      value = `_${value}`;
    }

    if (value.length > maxLength) {
      const extension = getFileExtension(value);
      const suffix = extension ? `.${extension}` : "";
      const baseLimit = Math.max(1, maxLength - suffix.length);

      value = `${getFilenameBase(value).slice(0, baseLimit)}${suffix}`;
    }

    return value;
  }

  function inferCategory(file) {
    const mime = normalizeMime(file && file.type);
    const extension = getFileExtension(file && file.name);

    for (const prefix of Object.keys(MIME_CATEGORY_MAP)) {
      if (mime.startsWith(prefix)) {
        return MIME_CATEGORY_MAP[prefix];
      }
    }

    if (DOCUMENT_MIME_TYPES.has(mime)) {
      return FILE_CATEGORY.DOCUMENT;
    }

    if (PRESENTATION_MIME_TYPES.has(mime)) {
      return FILE_CATEGORY.PRESENTATION;
    }

    if (SPREADSHEET_MIME_TYPES.has(mime)) {
      return FILE_CATEGORY.SPREADSHEET;
    }

    if (ARCHIVE_MIME_TYPES.has(mime)) {
      return FILE_CATEGORY.ARCHIVE;
    }

    if ([
      "jpg",
      "jpeg",
      "jpe",
      "png",
      "gif",
      "webp",
      "avif",
      "bmp",
      "tif",
      "tiff",
      "svg",
      "ico",
      "heic",
      "heif"
    ].includes(extension)) {
      return FILE_CATEGORY.IMAGE;
    }

    if ([
      "mp4",
      "m4v",
      "mov",
      "webm",
      "mkv",
      "avi",
      "mpg",
      "mpeg",
      "ogv"
    ].includes(extension)) {
      return FILE_CATEGORY.VIDEO;
    }

    if ([
      "mp3",
      "wav",
      "ogg",
      "oga",
      "m4a",
      "aac",
      "flac",
      "opus"
    ].includes(extension)) {
      return FILE_CATEGORY.AUDIO;
    }

    if ([
      "pdf",
      "doc",
      "docx",
      "odt",
      "rtf"
    ].includes(extension)) {
      return FILE_CATEGORY.DOCUMENT;
    }

    if ([
      "ppt",
      "pptx",
      "odp"
    ].includes(extension)) {
      return FILE_CATEGORY.PRESENTATION;
    }

    if ([
      "xls",
      "xlsx",
      "ods",
      "csv"
    ].includes(extension)) {
      return FILE_CATEGORY.SPREADSHEET;
    }

    if ([
      "txt",
      "md",
      "json",
      "xml",
      "yaml",
      "yml",
      "log"
    ].includes(extension)) {
      return FILE_CATEGORY.TEXT;
    }

    if ([
      "zip",
      "rar",
      "7z",
      "gz",
      "tar",
      "bz2"
    ].includes(extension)) {
      return FILE_CATEGORY.ARCHIVE;
    }

    if ([
      "woff",
      "woff2",
      "ttf",
      "otf",
      "eot"
    ].includes(extension)) {
      return FILE_CATEGORY.FONT;
    }

    return FILE_CATEGORY.UNKNOWN;
  }

  function readAscii(bytes, offset, length) {
    let value = "";

    for (let index = offset; index < offset + length; index += 1) {
      value += String.fromCharCode(bytes[index] || 0);
    }

    return value;
  }

  function bytesMatch(bytes, expected, offset) {
    const start = Number.isFinite(offset) ? offset : 0;

    if (bytes.length < start + expected.length) {
      return false;
    }

    for (let index = 0; index < expected.length; index += 1) {
      if (bytes[start + index] !== expected[index]) {
        return false;
      }
    }

    return true;
  }

  async function readFileBytes(file, byteLength) {
    if (!isBlob(file)) {
      throw new TypeError("A Blob or File is required.");
    }

    const length = Math.max(1, byteLength || DEFAULT_SIGNATURE_BYTES);
    const buffer = await file.slice(0, length).arrayBuffer();

    return new Uint8Array(buffer);
  }

  function createAbortError() {
    try {
      return new DOMException("Validation aborted.", "AbortError");
    } catch (error) {
      const abortError = new Error("Validation aborted.");
      abortError.name = "AbortError";
      return abortError;
    }
  }

  function throwIfAborted(signal) {
    if (signal && signal.aborted) {
      throw signal.reason || createAbortError();
    }
  }

  function emit(name, payload) {
    if (!eventBus) {
      return;
    }

    try {
      if (typeof eventBus.emit === "function") {
        eventBus.emit(name, payload);
      } else if (typeof eventBus.dispatch === "function") {
        eventBus.dispatch(name, payload);
      } else if (typeof eventBus.publish === "function") {
        eventBus.publish(name, payload);
      }
    } catch (error) {
      console.error(`[AIFTMediaLibrary] Event emission failed: ${name}`, error);
    }
  }

  function notify(type, message, options) {
    if (!notifications) {
      return;
    }

    try {
      if (typeof notifications[type] === "function") {
        notifications[type](message, options);
      } else if (typeof notifications.show === "function") {
        notifications.show({
          type,
          message,
          ...(options || {})
        });
      }
    } catch (error) {
      console.error("[AIFTMediaLibrary] Notification failed.", error);
    }
  }

  function syncStore(path, value) {
    if (!store) {
      return;
    }

    try {
      if (typeof store.set === "function") {
        store.set(path, value);
      } else if (typeof store.update === "function") {
        store.update(path, value);
      } else if (typeof store.dispatch === "function") {
        store.dispatch({
          type: "MEDIA_VALIDATION_UPDATE",
          payload: {
            path,
            value
          }
        });
      }
    } catch (error) {
      console.error("[AIFTMediaLibrary] Validation store sync failed.", error);
    }
  }

  function deepClone(value) {
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch (error) {
        return JSON.parse(JSON.stringify(value));
      }
    }

    return JSON.parse(JSON.stringify(value));
  }

  function mergeProfiles(base, override) {
    const merged = {
      ...deepClone(base),
      ...(override || {})
    };

    merged.allowedCategories = Array.isArray(merged.allowedCategories)
      ? Array.from(new Set(merged.allowedCategories))
      : [];

    merged.blockedCategories = Array.isArray(merged.blockedCategories)
      ? Array.from(new Set(merged.blockedCategories))
      : [];

    merged.allowedMimeTypes = Array.isArray(merged.allowedMimeTypes)
      ? Array.from(new Set(merged.allowedMimeTypes.map(normalizeMime)))
      : [];

    merged.blockedMimeTypes = Array.isArray(merged.blockedMimeTypes)
      ? Array.from(new Set(merged.blockedMimeTypes.map(normalizeMime)))
      : [];

    merged.allowedExtensions = Array.isArray(merged.allowedExtensions)
      ? Array.from(
          new Set(
            merged.allowedExtensions.map((extension) =>
              normalizeString(extension).replace(/^\./, "").toLowerCase()
            )
          )
        )
      : [];

    merged.blockedExtensions = Array.isArray(merged.blockedExtensions)
      ? Array.from(
          new Set(
            merged.blockedExtensions.map((extension) =>
              normalizeString(extension).replace(/^\./, "").toLowerCase()
            )
          )
        )
      : [];

    merged.customRules = Array.isArray(merged.customRules)
      ? merged.customRules.slice()
      : [];

    return merged;
  }

  /* =========================================================
     VALIDATION RESULT
  ========================================================= */

  class ValidationIssue {
    constructor(options) {
      const config = options || {};

      this.id = config.id || createId("issue");
      this.code = normalizeString(config.code || "VALIDATION_ISSUE");
      this.message = normalizeString(
        config.message || "The file did not pass validation."
      );
      this.severity =
        config.severity || VALIDATION_SEVERITY.ERROR;
      this.stage =
        config.stage || VALIDATION_STAGE.CUSTOM;
      this.ruleId = config.ruleId || null;
      this.field = config.field || null;
      this.expected =
        typeof config.expected === "undefined"
          ? null
          : config.expected;
      this.actual =
        typeof config.actual === "undefined"
          ? null
          : config.actual;
      this.metadata = config.metadata || {};
      this.createdAt = config.createdAt || now();
    }

    toJSON() {
      return {
        id: this.id,
        code: this.code,
        message: this.message,
        severity: this.severity,
        stage: this.stage,
        ruleId: this.ruleId,
        field: this.field,
        expected: this.expected,
        actual: this.actual,
        metadata: this.metadata,
        createdAt: this.createdAt
      };
    }
  }

  class ValidationResult {
    constructor(file, profile) {
      this.id = createId("validation");
      this.file = file;
      this.fileName = file ? file.name : "";
      this.fileSize = file ? file.size : 0;
      this.fileType = file ? file.type : "";
      this.lastModified = file ? file.lastModified : 0;
      this.profileId = profile ? profile.id : DEFAULT_PROFILE.id;
      this.status = VALIDATION_STATUS.PENDING;
      this.stage = VALIDATION_STAGE.BASIC;
      this.valid = false;
      this.startedAt = null;
      this.completedAt = null;
      this.durationMs = 0;
      this.category = file ? inferCategory(file) : FILE_CATEGORY.UNKNOWN;
      this.extension = file ? getFileExtension(file.name) : "";
      this.detectedMime = null;
      this.signature = null;
      this.sanitizedFilename = file ? file.name : "";
      this.metadata = {};
      this.issues = [];
      this.errors = [];
      this.warnings = [];
      this.information = [];
    }

    start() {
      this.status = VALIDATION_STATUS.RUNNING;
      this.startedAt = now();
      return this;
    }

    setStage(stage) {
      this.stage = stage;
      return this;
    }

    addIssue(issue) {
      const normalized =
        issue instanceof ValidationIssue
          ? issue
          : new ValidationIssue(issue);

      this.issues.push(normalized);

      if (
        normalized.severity === VALIDATION_SEVERITY.ERROR ||
        normalized.severity === VALIDATION_SEVERITY.CRITICAL
      ) {
        this.errors.push(normalized);
      } else if (
        normalized.severity === VALIDATION_SEVERITY.WARNING
      ) {
        this.warnings.push(normalized);
      } else {
        this.information.push(normalized);
      }

      return normalized;
    }

    addError(code, message, options) {
      return this.addIssue({
        ...(options || {}),
        code,
        message,
        severity: VALIDATION_SEVERITY.ERROR
      });
    }

    addWarning(code, message, options) {
      return this.addIssue({
        ...(options || {}),
        code,
        message,
        severity: VALIDATION_SEVERITY.WARNING
      });
    }

    addInfo(code, message, options) {
      return this.addIssue({
        ...(options || {}),
        code,
        message,
        severity: VALIDATION_SEVERITY.INFO
      });
    }

    complete() {
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;
      this.stage = VALIDATION_STAGE.COMPLETE;
      this.valid = this.errors.length === 0;

      if (!this.valid) {
        this.status = VALIDATION_STATUS.INVALID;
      } else if (this.warnings.length > 0) {
        this.status = VALIDATION_STATUS.WARNING;
      } else {
        this.status = VALIDATION_STATUS.VALID;
      }

      return this;
    }

    fail(error) {
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;
      this.status = VALIDATION_STATUS.FAILED;
      this.valid = false;

      this.addError(
        "VALIDATION_ENGINE_FAILURE",
        error && error.message
          ? error.message
          : "The validation engine failed.",
        {
          stage: this.stage,
          metadata: {
            name: error && error.name ? error.name : "Error",
            stack: error && error.stack ? error.stack : null
          }
        }
      );

      return this;
    }

    cancel() {
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;
      this.status = VALIDATION_STATUS.CANCELLED;
      this.valid = false;
      return this;
    }

    toJSON() {
      return {
        id: this.id,
        fileName: this.fileName,
        fileSize: this.fileSize,
        fileType: this.fileType,
        lastModified: this.lastModified,
        profileId: this.profileId,
        status: this.status,
        stage: this.stage,
        valid: this.valid,
        startedAt: this.startedAt,
        completedAt: this.completedAt,
        durationMs: this.durationMs,
        category: this.category,
        extension: this.extension,
        detectedMime: this.detectedMime,
        signature: this.signature,
        sanitizedFilename: this.sanitizedFilename,
        metadata: this.metadata,
        issues: this.issues.map((issue) => issue.toJSON()),
        errors: this.errors.map((issue) => issue.toJSON()),
        warnings: this.warnings.map((issue) => issue.toJSON()),
        information: this.information.map((issue) => issue.toJSON())
      };
    }
  }

  /* =========================================================
     VALIDATION CACHE
  ========================================================= */

  class ValidationCache {
    constructor(options) {
      const config = options || {};

      this.ttl = Number.isFinite(config.ttl)
        ? Math.max(0, config.ttl)
        : DEFAULT_CACHE_TTL;
      this.maxEntries = Number.isFinite(config.maxEntries)
        ? Math.max(1, config.maxEntries)
        : 500;
      this.entries = new Map();
    }

    createKey(file, profileId) {
      return [
        normalizeString(file && file.name),
        Number(file && file.size) || 0,
        Number(file && file.lastModified) || 0,
        normalizeMime(file && file.type),
        normalizeString(profileId || DEFAULT_PROFILE.id)
      ].join("::");
    }

    get(file, profileId) {
      const key = this.createKey(file, profileId);
      const entry = this.entries.get(key);

      if (!entry) {
        return null;
      }

      if (this.ttl > 0 && now() - entry.createdAt > this.ttl) {
        this.entries.delete(key);
        return null;
      }

      this.entries.delete(key);
      this.entries.set(key, entry);

      return entry.value;
    }

    set(file, profileId, value) {
      const key = this.createKey(file, profileId);

      this.entries.set(key, {
        createdAt: now(),
        value
      });

      while (this.entries.size > this.maxEntries) {
        const oldestKey = this.entries.keys().next().value;
        this.entries.delete(oldestKey);
      }

      return value;
    }

    delete(file, profileId) {
      return this.entries.delete(
        this.createKey(file, profileId)
      );
    }

    clear() {
      this.entries.clear();
    }

    prune() {
      if (this.ttl <= 0) {
        return 0;
      }

      let removed = 0;
      const timestamp = now();

      for (const [key, entry] of this.entries.entries()) {
        if (timestamp - entry.createdAt > this.ttl) {
          this.entries.delete(key);
          removed += 1;
        }
      }

      return removed;
    }

    get size() {
      return this.entries.size;
    }
  }

  /* =========================================================
     PROFILE MANAGER
  ========================================================= */

  class ValidationProfileManager {
    constructor() {
      this.profiles = new Map();
      this.defaultProfileId = DEFAULT_PROFILE.id;

      this.register(DEFAULT_PROFILE);
    }

    register(profile) {
      if (!profile || typeof profile !== "object") {
        throw new TypeError("A validation profile object is required.");
      }

      const id = normalizeString(profile.id);

      if (!id) {
        throw new Error("Validation profiles require a unique id.");
      }

      const normalized = mergeProfiles(DEFAULT_PROFILE, {
        ...profile,
        id
      });

      this.profiles.set(id, normalized);

      emit("media:validation:profile:registered", {
        profile: deepClone(normalized)
      });

      return deepClone(normalized);
    }

    update(id, updates) {
      const current = this.get(id);

      if (!current) {
        throw new Error(`Validation profile not found: ${id}`);
      }

      return this.register({
        ...current,
        ...(updates || {}),
        id
      });
    }

    remove(id) {
      const normalizedId = normalizeString(id);

      if (normalizedId === this.defaultProfileId) {
        throw new Error("The default validation profile cannot be removed.");
      }

      const removed = this.profiles.delete(normalizedId);

      if (removed) {
        emit("media:validation:profile:removed", {
          profileId: normalizedId
        });
      }

      return removed;
    }

    get(id) {
      const normalizedId =
        normalizeString(id) || this.defaultProfileId;

      const profile =
        this.profiles.get(normalizedId) ||
        this.profiles.get(this.defaultProfileId);

      return profile ? deepClone(profile) : null;
    }

    resolve(profileOrId) {
      if (!profileOrId) {
        return this.get(this.defaultProfileId);
      }

      if (typeof profileOrId === "string") {
        return this.get(profileOrId);
      }

      if (typeof profileOrId === "object") {
        return mergeProfiles(DEFAULT_PROFILE, profileOrId);
      }

      return this.get(this.defaultProfileId);
    }

    list() {
      return Array.from(this.profiles.values()).map(deepClone);
    }

    setDefault(id) {
      const normalizedId = normalizeString(id);

      if (!this.profiles.has(normalizedId)) {
        throw new Error(`Validation profile not found: ${normalizedId}`);
      }

      this.defaultProfileId = normalizedId;

      emit("media:validation:profile:default", {
        profileId: normalizedId
      });

      return this.get(normalizedId);
    }
  }

  /* =========================================================
     SIGNATURE INSPECTOR
  ========================================================= */

  class FileSignatureInspector {
    constructor(options) {
      const config = options || {};

      this.signatures = Array.isArray(config.signatures)
        ? config.signatures.slice()
        : FILE_SIGNATURES.slice();

      this.readLength = Number.isFinite(config.readLength)
        ? Math.max(8, config.readLength)
        : DEFAULT_SIGNATURE_BYTES;
    }

    register(signature) {
      if (!signature || typeof signature !== "object") {
        throw new TypeError("A file signature descriptor is required.");
      }

      this.signatures.push(signature);
      return signature;
    }

    async inspect(file, options) {
      const config = options || {};
      const signal = config.signal;

      throwIfAborted(signal);

      const bytes = await readFileBytes(
        file,
        config.readLength || this.readLength
      );

      throwIfAborted(signal);

      for (const signature of this.signatures) {
        let matched = false;

        if (typeof signature.matcher === "function") {
          matched = Boolean(
            await signature.matcher(bytes, file, {
              signal
            })
          );
        } else if (Array.isArray(signature.bytes)) {
          matched = bytesMatch(
            bytes,
            signature.bytes,
            signature.offset || 0
          );
        } else if (typeof signature.ascii === "string") {
          matched =
            readAscii(
              bytes,
              signature.offset || 0,
              signature.ascii.length
            ) === signature.ascii;
        }

        if (matched) {
          return {
            matched: true,
            name: signature.name || null,
            mime: signature.mime || null,
            extensions: Array.isArray(signature.extensions)
              ? signature.extensions.slice()
              : [],
            bytesRead: bytes.length
          };
        }
      }

      return {
        matched: false,
        name: null,
        mime: null,
        extensions: [],
        bytesRead: bytes.length
      };
    }
  }

  /* =========================================================
     MEDIA METADATA INSPECTOR
  ========================================================= */

  class MediaMetadataInspector {
    async inspectImage(file, options) {
      const config = options || {};
      const signal = config.signal;

      throwIfAborted(signal);

      if (
        typeof createImageBitmap === "function" &&
        !normalizeMime(file.type).includes("svg")
      ) {
        let bitmap = null;

        try {
          bitmap = await createImageBitmap(file);

          throwIfAborted(signal);

          return {
            width: bitmap.width,
            height: bitmap.height,
            pixels: bitmap.width * bitmap.height,
            method: "createImageBitmap"
          };
        } finally {
          if (bitmap && typeof bitmap.close === "function") {
            bitmap.close();
          }
        }
      }

      if (
        typeof document === "undefined" ||
        typeof URL === "undefined"
      ) {
        throw new Error(
          "Image metadata inspection is unavailable in this environment."
        );
      }

      return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        const cleanup = () => {
          image.onload = null;
          image.onerror = null;
          URL.revokeObjectURL(objectUrl);

          if (signal) {
            signal.removeEventListener("abort", handleAbort);
          }
        };

        const handleAbort = () => {
          cleanup();
          reject(signal.reason || createAbortError());
        };

        image.onload = () => {
          const width = image.naturalWidth || image.width || 0;
          const height = image.naturalHeight || image.height || 0;

          cleanup();

          resolve({
            width,
            height,
            pixels: width * height,
            method: "image-element"
          });
        };

        image.onerror = () => {
          cleanup();
          reject(
            new Error("Unable to decode image metadata.")
          );
        };

        if (signal) {
          signal.addEventListener("abort", handleAbort, {
            once: true
          });
        }

        image.src = objectUrl;
      });
    }

    async inspectVideo(file, options) {
      return this.inspectTimedMedia(file, "video", options);
    }

    async inspectAudio(file, options) {
      return this.inspectTimedMedia(file, "audio", options);
    }

    async inspectTimedMedia(file, type, options) {
      const config = options || {};
      const signal = config.signal;

      throwIfAborted(signal);

      if (
        typeof document === "undefined" ||
        typeof URL === "undefined"
      ) {
        throw new Error(
          `${type} metadata inspection is unavailable in this environment.`
        );
      }

      return new Promise((resolve, reject) => {
        const element = document.createElement(type);
        const objectUrl = URL.createObjectURL(file);

        element.preload = "metadata";
        element.muted = true;

        const cleanup = () => {
          element.removeAttribute("src");

          try {
            element.load();
          } catch (error) {
            void error;
          }

          URL.revokeObjectURL(objectUrl);
          element.onloadedmetadata = null;
          element.onerror = null;

          if (signal) {
            signal.removeEventListener("abort", handleAbort);
          }
        };

        const handleAbort = () => {
          cleanup();
          reject(signal.reason || createAbortError());
        };

        element.onloadedmetadata = () => {
          const metadata = {
            duration: Number.isFinite(element.duration)
              ? element.duration
              : 0,
            method: `${type}-element`
          };

          if (type === "video") {
            metadata.width = element.videoWidth || 0;
            metadata.height = element.videoHeight || 0;
            metadata.pixels =
              metadata.width * metadata.height;
          }

          cleanup();
          resolve(metadata);
        };

        element.onerror = () => {
          cleanup();
          reject(
            new Error(`Unable to decode ${type} metadata.`)
          );
        };

        if (signal) {
          signal.addEventListener("abort", handleAbort, {
            once: true
          });
        }

        element.src = objectUrl;
      });
    }
  }

  /* =========================================================
     RULE ABSTRACTION
  ========================================================= */

  class ValidationRule {
    constructor(options) {
      const config = options || {};

      this.id = normalizeString(config.id || createId("rule"));
      this.label = normalizeString(config.label || this.id);
      this.stage =
        config.stage || VALIDATION_STAGE.CUSTOM;
      this.priority = Number.isFinite(config.priority)
        ? config.priority
        : 100;
      this.enabled = config.enabled !== false;
      this.categories = Array.isArray(config.categories)
        ? config.categories.slice()
        : [];
      this.validator = config.validator;

      if (typeof this.validator !== "function") {
        throw new TypeError(
          `Validation rule "${this.id}" requires a validator function.`
        );
      }
    }

    supports(context) {
      if (!this.enabled) {
        return false;
      }

      if (this.categories.length === 0) {
        return true;
      }

      return this.categories.includes(context.result.category);
    }

    async run(context) {
      if (!this.supports(context)) {
        return null;
      }

      return this.validator(context);
    }
  }

  /* =========================================================
     SECURITY HOOK REGISTRY
  ========================================================= */

  class SecurityHookRegistry {
    constructor() {
      this.hooks = new Map();
    }

    register(id, handler, options) {
      const normalizedId = normalizeString(id);

      if (!normalizedId) {
        throw new Error("Security hooks require a unique id.");
      }

      if (typeof handler !== "function") {
        throw new TypeError(
          `Security hook "${normalizedId}" requires a function.`
        );
      }

      const config = options || {};

      this.hooks.set(normalizedId, {
        id: normalizedId,
        label: normalizeString(config.label || normalizedId),
        priority: Number.isFinite(config.priority)
          ? config.priority
          : 100,
        enabled: config.enabled !== false,
        handler,
        failClosed: config.failClosed === true
      });

      emit("media:validation:security-hook:registered", {
        id: normalizedId
      });

      return normalizedId;
    }

    unregister(id) {
      return this.hooks.delete(normalizeString(id));
    }

    enable(id) {
      const hook = this.hooks.get(normalizeString(id));

      if (!hook) {
        return false;
      }

      hook.enabled = true;
      return true;
    }

    disable(id) {
      const hook = this.hooks.get(normalizeString(id));

      if (!hook) {
        return false;
      }

      hook.enabled = false;
      return true;
    }

    list() {
      return Array.from(this.hooks.values())
        .sort((a, b) => a.priority - b.priority)
        .map((hook) => ({
          id: hook.id,
          label: hook.label,
          priority: hook.priority,
          enabled: hook.enabled,
          failClosed: hook.failClosed
        }));
    }

    async run(context) {
      const hooks = Array.from(this.hooks.values())
        .filter((hook) => hook.enabled)
        .sort((a, b) => a.priority - b.priority);

      const results = [];

      for (const hook of hooks) {
        throwIfAborted(context.signal);

        try {
          const value = await hook.handler(context);

          results.push({
            id: hook.id,
            success: true,
            value
          });
        } catch (error) {
          results.push({
            id: hook.id,
            success: false,
            error
          });

          if (hook.failClosed || context.profile.failOnHookError) {
            context.result.addError(
              "SECURITY_HOOK_FAILED",
              `Security validation failed in "${hook.label}".`,
              {
                stage: VALIDATION_STAGE.SECURITY,
                ruleId: hook.id,
                metadata: {
                  error:
                    error && error.message
                      ? error.message
                      : String(error)
                }
              }
            );
          } else {
            context.result.addWarning(
              "SECURITY_HOOK_UNAVAILABLE",
              `Security validation "${hook.label}" could not be completed.`,
              {
                stage: VALIDATION_STAGE.SECURITY,
                ruleId: hook.id,
                metadata: {
                  error:
                    error && error.message
                      ? error.message
                      : String(error)
                }
              }
            );
          }
        }
      }

      return results;
    }
  }

  /* =========================================================
     DUPLICATE DETECTOR ADAPTER
  ========================================================= */

  class DuplicateDetectorAdapter {
    constructor() {
      this.fallbackFingerprints = new Map();
    }

    async createFingerprint(file) {
      if (
        uploads.fingerprinting &&
        typeof uploads.fingerprinting.create === "function"
      ) {
        return uploads.fingerprinting.create(file);
      }

      if (
        uploads.createFileFingerprint &&
        typeof uploads.createFileFingerprint === "function"
      ) {
        return uploads.createFileFingerprint(file);
      }

      return [
        file.name,
        file.size,
        file.lastModified,
        normalizeMime(file.type)
      ].join("::");
    }

    async inspect(file, options) {
      const config = options || {};
      const fingerprint = await this.createFingerprint(file);

      let duplicate = null;

      if (
        uploads.duplicates &&
        typeof uploads.duplicates.find === "function"
      ) {
        duplicate = await uploads.duplicates.find(
          fingerprint,
          file,
          config
        );
      } else if (
        uploads.duplicateDetector &&
        typeof uploads.duplicateDetector.find === "function"
      ) {
        duplicate = await uploads.duplicateDetector.find(
          fingerprint,
          file,
          config
        );
      } else if (this.fallbackFingerprints.has(fingerprint)) {
        duplicate = this.fallbackFingerprints.get(fingerprint);
      }

      if (!duplicate) {
        this.fallbackFingerprints.set(fingerprint, {
          fingerprint,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          registeredAt: now()
        });
      }

      return {
        fingerprint,
        duplicate
      };
    }

    clear() {
      this.fallbackFingerprints.clear();
    }
  }

  /* =========================================================
     BUILT-IN RULES
  ========================================================= */

  function createBuiltInRules() {
    return [
      new ValidationRule({
        id: "file-instance",
        label: "File instance",
        stage: VALIDATION_STAGE.BASIC,
        priority: 10,
        validator(context) {
          if (!isFile(context.file)) {
            context.result.addError(
              "INVALID_FILE_OBJECT",
              "The selected item is not a valid File object.",
              {
                stage: VALIDATION_STAGE.BASIC,
                ruleId: "file-instance"
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "file-size",
        label: "File size",
        stage: VALIDATION_STAGE.SIZE,
        priority: 20,
        validator(context) {
          const file = context.file;
          const profile = context.profile;

          if (!profile.allowEmptyFiles && file.size === 0) {
            context.result.addError(
              "EMPTY_FILE",
              "Empty files cannot be uploaded.",
              {
                stage: VALIDATION_STAGE.SIZE,
                ruleId: "file-size",
                field: "size",
                expected: `>= ${Math.max(1, profile.minFileSize)}`,
                actual: file.size
              }
            );

            return;
          }

          if (
            Number.isFinite(profile.minFileSize) &&
            file.size < profile.minFileSize
          ) {
            context.result.addError(
              "FILE_TOO_SMALL",
              "The file is smaller than the allowed minimum size.",
              {
                stage: VALIDATION_STAGE.SIZE,
                ruleId: "file-size",
                field: "size",
                expected: profile.minFileSize,
                actual: file.size
              }
            );
          }

          if (
            Number.isFinite(profile.maxFileSize) &&
            file.size > profile.maxFileSize
          ) {
            context.result.addError(
              "FILE_TOO_LARGE",
              "The file exceeds the maximum allowed size.",
              {
                stage: VALIDATION_STAGE.SIZE,
                ruleId: "file-size",
                field: "size",
                expected: profile.maxFileSize,
                actual: file.size
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "filename",
        label: "Filename",
        stage: VALIDATION_STAGE.NAME,
        priority: 30,
        validator(context) {
          const file = context.file;
          const profile = context.profile;
          const name = normalizeString(file.name);

          if (!name) {
            context.result.addError(
              "MISSING_FILENAME",
              "The file does not have a valid name.",
              {
                stage: VALIDATION_STAGE.NAME,
                ruleId: "filename"
              }
            );

            return;
          }

          if (
            Number.isFinite(profile.maxFilenameLength) &&
            name.length > profile.maxFilenameLength
          ) {
            context.result.addError(
              "FILENAME_TOO_LONG",
              "The filename exceeds the allowed length.",
              {
                stage: VALIDATION_STAGE.NAME,
                ruleId: "filename",
                field: "name",
                expected: profile.maxFilenameLength,
                actual: name.length
              }
            );
          }

          if (
            profile.rejectHiddenFiles &&
            isHiddenFilename(name)
          ) {
            context.result.addError(
              "HIDDEN_FILE_REJECTED",
              "Hidden files are not allowed.",
              {
                stage: VALIDATION_STAGE.NAME,
                ruleId: "filename",
                field: "name",
                actual: name
              }
            );
          }

          if (
            profile.rejectReservedNames &&
            isReservedFilename(name)
          ) {
            context.result.addError(
              "RESERVED_FILENAME",
              "The filename is reserved by the operating system.",
              {
                stage: VALIDATION_STAGE.NAME,
                ruleId: "filename",
                field: "name",
                actual: name
              }
            );
          }

          if (
            profile.rejectDoubleExtensions &&
            hasDoubleExtension(name)
          ) {
            context.result.addError(
              "DANGEROUS_DOUBLE_EXTENSION",
              "The filename contains a potentially dangerous double extension.",
              {
                stage: VALIDATION_STAGE.NAME,
                ruleId: "filename",
                field: "name",
                actual: name
              }
            );
          }

          if (profile.sanitizeFilename) {
            const sanitized = sanitizeFilename(name, {
              maxLength: profile.maxFilenameLength,
              normalizeUnicode: profile.normalizeUnicode
            });

            context.result.sanitizedFilename = sanitized;

            if (sanitized !== name) {
              context.result.addInfo(
                "FILENAME_SANITIZED",
                "The filename will be normalized before upload.",
                {
                  stage: VALIDATION_STAGE.NAME,
                  ruleId: "filename",
                  field: "name",
                  expected: sanitized,
                  actual: name
                }
              );
            }
          } else {
            context.result.sanitizedFilename = name;
          }
        }
      }),

      new ValidationRule({
        id: "extension",
        label: "File extension",
        stage: VALIDATION_STAGE.EXTENSION,
        priority: 40,
        validator(context) {
          const profile = context.profile;
          const extension = context.result.extension;

          if (!extension && profile.requireKnownExtension) {
            context.result.addError(
              "MISSING_EXTENSION",
              "A recognized file extension is required.",
              {
                stage: VALIDATION_STAGE.EXTENSION,
                ruleId: "extension"
              }
            );

            return;
          }

          if (
            profile.rejectDangerousExtensions &&
            DANGEROUS_EXTENSIONS.has(extension)
          ) {
            context.result.addError(
              "DANGEROUS_EXTENSION",
              `Files with the .${extension} extension are not allowed.`,
              {
                stage: VALIDATION_STAGE.EXTENSION,
                ruleId: "extension",
                actual: extension
              }
            );
          }

          if (
            profile.blockedExtensions.includes(extension)
          ) {
            context.result.addError(
              "BLOCKED_EXTENSION",
              `Files with the .${extension} extension are blocked.`,
              {
                stage: VALIDATION_STAGE.EXTENSION,
                ruleId: "extension",
                actual: extension
              }
            );
          }

          if (
            profile.allowedExtensions.length > 0 &&
            !profile.allowedExtensions.includes(extension)
          ) {
            context.result.addError(
              "EXTENSION_NOT_ALLOWED",
              `Files with the .${extension || "unknown"} extension are not allowed.`,
              {
                stage: VALIDATION_STAGE.EXTENSION,
                ruleId: "extension",
                expected: profile.allowedExtensions,
                actual: extension
              }
            );
          }

          if (
            profile.requireKnownExtension &&
            extension &&
            !EXTENSION_MIME_MAP[extension]
          ) {
            context.result.addError(
              "UNKNOWN_EXTENSION",
              "The file extension is not recognized.",
              {
                stage: VALIDATION_STAGE.EXTENSION,
                ruleId: "extension",
                actual: extension
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "mime-type",
        label: "MIME type",
        stage: VALIDATION_STAGE.MIME,
        priority: 50,
        validator(context) {
          const profile = context.profile;
          const mime = normalizeMime(context.file.type);

          if (!mime && profile.requireKnownMimeType) {
            context.result.addError(
              "MISSING_MIME_TYPE",
              "The browser could not determine the file type.",
              {
                stage: VALIDATION_STAGE.MIME,
                ruleId: "mime-type"
              }
            );

            return;
          }

          if (profile.blockedMimeTypes.includes(mime)) {
            context.result.addError(
              "BLOCKED_MIME_TYPE",
              `Files with MIME type "${mime}" are blocked.`,
              {
                stage: VALIDATION_STAGE.MIME,
                ruleId: "mime-type",
                actual: mime
              }
            );
          }

          if (
            profile.allowedMimeTypes.length > 0 &&
            !profile.allowedMimeTypes.includes(mime)
          ) {
            context.result.addError(
              "MIME_TYPE_NOT_ALLOWED",
              `Files with MIME type "${mime || "unknown"}" are not allowed.`,
              {
                stage: VALIDATION_STAGE.MIME,
                ruleId: "mime-type",
                expected: profile.allowedMimeTypes,
                actual: mime
              }
            );
          }

          const extension = context.result.extension;
          const allowedMimes = EXTENSION_MIME_MAP[extension] || [];

          if (
            extension &&
            mime &&
            allowedMimes.length > 0 &&
            !allowedMimes.includes(mime)
          ) {
            const issue = {
              stage: VALIDATION_STAGE.MIME,
              ruleId: "mime-type",
              expected: allowedMimes,
              actual: mime,
              metadata: {
                extension
              }
            };

            if (profile.rejectExtensionMismatch) {
              context.result.addError(
                "EXTENSION_MIME_MISMATCH",
                "The file extension does not match the browser-reported MIME type.",
                issue
              );
            } else {
              context.result.addWarning(
                "EXTENSION_MIME_MISMATCH",
                "The file extension may not match the browser-reported MIME type.",
                issue
              );
            }
          }
        }
      }),

      new ValidationRule({
        id: "category",
        label: "File category",
        stage: VALIDATION_STAGE.MIME,
        priority: 60,
        validator(context) {
          const profile = context.profile;
          const category = context.result.category;

          if (profile.blockedCategories.includes(category)) {
            context.result.addError(
              "BLOCKED_FILE_CATEGORY",
              `Files in the "${category}" category are blocked.`,
              {
                stage: VALIDATION_STAGE.MIME,
                ruleId: "category",
                actual: category
              }
            );
          }

          if (
            profile.allowedCategories.length > 0 &&
            !profile.allowedCategories.includes(category)
          ) {
            context.result.addError(
              "FILE_CATEGORY_NOT_ALLOWED",
              `Files in the "${category}" category are not allowed.`,
              {
                stage: VALIDATION_STAGE.MIME,
                ruleId: "category",
                expected: profile.allowedCategories,
                actual: category
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "signature",
        label: "File signature",
        stage: VALIDATION_STAGE.SIGNATURE,
        priority: 70,
        async validator(context) {
          const profile = context.profile;

          if (!profile.enableSignatureInspection) {
            return;
          }

          const inspection =
            await context.signatureInspector.inspect(
              context.file,
              {
                signal: context.signal
              }
            );

          context.result.signature = inspection;
          context.result.detectedMime = inspection.mime;

          if (!inspection.matched) {
            if (profile.requireSignatureMatch) {
              context.result.addError(
                "UNKNOWN_FILE_SIGNATURE",
                "The file signature could not be recognized.",
                {
                  stage: VALIDATION_STAGE.SIGNATURE,
                  ruleId: "signature"
                }
              );
            } else {
              context.result.addWarning(
                "UNKNOWN_FILE_SIGNATURE",
                "The file signature could not be verified.",
                {
                  stage: VALIDATION_STAGE.SIGNATURE,
                  ruleId: "signature"
                }
              );
            }

            return;
          }

          const browserMime = normalizeMime(context.file.type);

          if (
            inspection.mime &&
            browserMime &&
            inspection.mime !== browserMime
          ) {
            const compatible =
              inspection.mime === "application/zip" &&
              [
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
              ].includes(browserMime);

            if (!compatible) {
              const issue = {
                stage: VALIDATION_STAGE.SIGNATURE,
                ruleId: "signature",
                expected: inspection.mime,
                actual: browserMime
              };

              if (profile.rejectMimeMismatch) {
                context.result.addError(
                  "SIGNATURE_MIME_MISMATCH",
                  "The file signature does not match the reported MIME type.",
                  issue
                );
              } else {
                context.result.addWarning(
                  "SIGNATURE_MIME_MISMATCH",
                  "The file signature may not match the reported MIME type.",
                  issue
                );
              }
            }
          }

          const extension = context.result.extension;

          if (
            inspection.extensions.length > 0 &&
            extension &&
            !inspection.extensions.includes(extension)
          ) {
            const officeZipExtensions = [
              "docx",
              "xlsx",
              "pptx",
              "odt",
              "ods",
              "odp"
            ];

            const compatibleOfficeArchive =
              inspection.name === "zip" &&
              officeZipExtensions.includes(extension);

            if (!compatibleOfficeArchive) {
              const issue = {
                stage: VALIDATION_STAGE.SIGNATURE,
                ruleId: "signature",
                expected: inspection.extensions,
                actual: extension
              };

              if (profile.rejectExtensionMismatch) {
                context.result.addError(
                  "SIGNATURE_EXTENSION_MISMATCH",
                  "The file signature does not match the filename extension.",
                  issue
                );
              } else {
                context.result.addWarning(
                  "SIGNATURE_EXTENSION_MISMATCH",
                  "The file signature may not match the filename extension.",
                  issue
                );
              }
            }
          }
        }
      }),

      new ValidationRule({
        id: "image-metadata",
        label: "Image dimensions",
        stage: VALIDATION_STAGE.DIMENSIONS,
        priority: 80,
        categories: [FILE_CATEGORY.IMAGE],
        async validator(context) {
          if (!context.profile.validateDimensions) {
            return;
          }

          try {
            const metadata =
              await context.metadataInspector.inspectImage(
                context.file,
                {
                  signal: context.signal
                }
              );

            context.result.metadata.image = metadata;

            if (
              metadata.width < context.profile.minImageWidth ||
              metadata.height < context.profile.minImageHeight
            ) {
              context.result.addError(
                "IMAGE_DIMENSIONS_TOO_SMALL",
                "The image dimensions are smaller than allowed.",
                {
                  stage: VALIDATION_STAGE.DIMENSIONS,
                  ruleId: "image-metadata",
                  expected: {
                    minWidth: context.profile.minImageWidth,
                    minHeight: context.profile.minImageHeight
                  },
                  actual: {
                    width: metadata.width,
                    height: metadata.height
                  }
                }
              );
            }

            if (
              metadata.width > context.profile.maxImageWidth ||
              metadata.height > context.profile.maxImageHeight
            ) {
              context.result.addError(
                "IMAGE_DIMENSIONS_TOO_LARGE",
                "The image dimensions exceed the allowed maximum.",
                {
                  stage: VALIDATION_STAGE.DIMENSIONS,
                  ruleId: "image-metadata",
                  expected: {
                    maxWidth: context.profile.maxImageWidth,
                    maxHeight: context.profile.maxImageHeight
                  },
                  actual: {
                    width: metadata.width,
                    height: metadata.height
                  }
                }
              );
            }

            if (
              Number.isFinite(context.profile.maxImagePixels) &&
              metadata.pixels > context.profile.maxImagePixels
            ) {
              context.result.addError(
                "IMAGE_PIXEL_LIMIT_EXCEEDED",
                "The image contains more pixels than allowed.",
                {
                  stage: VALIDATION_STAGE.DIMENSIONS,
                  ruleId: "image-metadata",
                  expected: context.profile.maxImagePixels,
                  actual: metadata.pixels
                }
              );
            }
          } catch (error) {
            if (error && error.name === "AbortError") {
              throw error;
            }

            context.result.addError(
              "IMAGE_METADATA_UNREADABLE",
              "The image could not be decoded or inspected.",
              {
                stage: VALIDATION_STAGE.DIMENSIONS,
                ruleId: "image-metadata",
                metadata: {
                  error:
                    error && error.message
                      ? error.message
                      : String(error)
                }
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "video-metadata",
        label: "Video metadata",
        stage: VALIDATION_STAGE.DIMENSIONS,
        priority: 90,
        categories: [FILE_CATEGORY.VIDEO],
        async validator(context) {
          try {
            const metadata =
              await context.metadataInspector.inspectVideo(
                context.file,
                {
                  signal: context.signal
                }
              );

            context.result.metadata.video = metadata;

            if (context.profile.validateDimensions) {
              if (
                metadata.width < context.profile.minVideoWidth ||
                metadata.height < context.profile.minVideoHeight
              ) {
                context.result.addError(
                  "VIDEO_DIMENSIONS_TOO_SMALL",
                  "The video resolution is smaller than allowed.",
                  {
                    stage: VALIDATION_STAGE.DIMENSIONS,
                    ruleId: "video-metadata",
                    expected: {
                      minWidth: context.profile.minVideoWidth,
                      minHeight: context.profile.minVideoHeight
                    },
                    actual: {
                      width: metadata.width,
                      height: metadata.height
                    }
                  }
                );
              }

              if (
                metadata.width > context.profile.maxVideoWidth ||
                metadata.height > context.profile.maxVideoHeight
              ) {
                context.result.addError(
                  "VIDEO_DIMENSIONS_TOO_LARGE",
                  "The video resolution exceeds the allowed maximum.",
                  {
                    stage: VALIDATION_STAGE.DIMENSIONS,
                    ruleId: "video-metadata",
                    expected: {
                      maxWidth: context.profile.maxVideoWidth,
                      maxHeight: context.profile.maxVideoHeight
                    },
                    actual: {
                      width: metadata.width,
                      height: metadata.height
                    }
                  }
                );
              }
            }

            validateDuration(context, metadata.duration, "video-metadata");
          } catch (error) {
            if (error && error.name === "AbortError") {
              throw error;
            }

            context.result.addError(
              "VIDEO_METADATA_UNREADABLE",
              "The video could not be decoded or inspected.",
              {
                stage: VALIDATION_STAGE.DIMENSIONS,
                ruleId: "video-metadata",
                metadata: {
                  error:
                    error && error.message
                      ? error.message
                      : String(error)
                }
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "audio-metadata",
        label: "Audio metadata",
        stage: VALIDATION_STAGE.DURATION,
        priority: 100,
        categories: [FILE_CATEGORY.AUDIO],
        async validator(context) {
          try {
            const metadata =
              await context.metadataInspector.inspectAudio(
                context.file,
                {
                  signal: context.signal
                }
              );

            context.result.metadata.audio = metadata;

            validateDuration(context, metadata.duration, "audio-metadata");
          } catch (error) {
            if (error && error.name === "AbortError") {
              throw error;
            }

            context.result.addError(
              "AUDIO_METADATA_UNREADABLE",
              "The audio file could not be decoded or inspected.",
              {
                stage: VALIDATION_STAGE.DURATION,
                ruleId: "audio-metadata",
                metadata: {
                  error:
                    error && error.message
                      ? error.message
                      : String(error)
                }
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "duplicate",
        label: "Duplicate detection",
        stage: VALIDATION_STAGE.DUPLICATE,
        priority: 110,
        async validator(context) {
          if (!context.profile.enableDuplicateInspection) {
            return;
          }

          const inspection =
            await context.duplicateDetector.inspect(
              context.file,
              {
                signal: context.signal,
                profile: context.profile
              }
            );

          context.result.metadata.fingerprint =
            inspection.fingerprint;

          if (!inspection.duplicate) {
            return;
          }

          context.result.metadata.duplicate =
            inspection.duplicate;

          const policy =
            normalizeString(context.profile.duplicatePolicy)
              .toLowerCase();

          if (policy === "reject" || policy === "error") {
            context.result.addError(
              "DUPLICATE_FILE",
              "This file appears to have already been added.",
              {
                stage: VALIDATION_STAGE.DUPLICATE,
                ruleId: "duplicate",
                metadata: {
                  duplicate: inspection.duplicate
                }
              }
            );
          } else if (policy === "warning") {
            context.result.addWarning(
              "DUPLICATE_FILE",
              "This file may already exist in the media library.",
              {
                stage: VALIDATION_STAGE.DUPLICATE,
                ruleId: "duplicate",
                metadata: {
                  duplicate: inspection.duplicate
                }
              }
            );
          }
        }
      }),

      new ValidationRule({
        id: "security-hooks",
        label: "Security validation",
        stage: VALIDATION_STAGE.SECURITY,
        priority: 120,
        async validator(context) {
          if (!context.profile.enableSecurityHooks) {
            return;
          }

          context.result.metadata.security =
            await context.securityHooks.run(context);
        }
      })
    ];
  }

  function validateDuration(context, duration, ruleId) {
    if (!context.profile.validateDuration) {
      return;
    }

    if (!Number.isFinite(duration)) {
      context.result.addWarning(
        "MEDIA_DURATION_UNKNOWN",
        "The media duration could not be determined.",
        {
          stage: VALIDATION_STAGE.DURATION,
          ruleId
        }
      );

      return;
    }

    if (
      Number.isFinite(context.profile.minDurationSeconds) &&
      duration < context.profile.minDurationSeconds
    ) {
      context.result.addError(
        "MEDIA_DURATION_TOO_SHORT",
        "The media duration is shorter than allowed.",
        {
          stage: VALIDATION_STAGE.DURATION,
          ruleId,
          expected: context.profile.minDurationSeconds,
          actual: duration
        }
      );
    }

    if (
      Number.isFinite(context.profile.maxDurationSeconds) &&
      duration > context.profile.maxDurationSeconds
    ) {
      context.result.addError(
        "MEDIA_DURATION_TOO_LONG",
        "The media duration exceeds the allowed maximum.",
        {
          stage: VALIDATION_STAGE.DURATION,
          ruleId,
          expected: context.profile.maxDurationSeconds,
          actual: duration
        }
      );
    }
  }

  /* =========================================================
     FILE VALIDATION ENGINE
  ========================================================= */

  class FileValidationEngine {
    constructor(options) {
      const config = options || {};

      this.profileManager =
        config.profileManager || new ValidationProfileManager();

      this.signatureInspector =
        config.signatureInspector ||
        new FileSignatureInspector(config.signatureOptions);

      this.metadataInspector =
        config.metadataInspector ||
        new MediaMetadataInspector();

      this.securityHooks =
        config.securityHooks ||
        new SecurityHookRegistry();

      this.duplicateDetector =
        config.duplicateDetector ||
        new DuplicateDetectorAdapter();

      this.cache =
        config.cache ||
        new ValidationCache(config.cacheOptions);

      this.rules = new Map();
      this.activeControllers = new Map();
      this.batchConcurrency = Number.isFinite(config.batchConcurrency)
        ? Math.max(1, config.batchConcurrency)
        : DEFAULT_BATCH_CONCURRENCY;

      const builtInRules = createBuiltInRules();

      for (const rule of builtInRules) {
        this.registerRule(rule);
      }
    }

    registerRule(ruleOrOptions) {
      const rule =
        ruleOrOptions instanceof ValidationRule
          ? ruleOrOptions
          : new ValidationRule(ruleOrOptions);

      this.rules.set(rule.id, rule);

      emit("media:validation:rule:registered", {
        ruleId: rule.id,
        stage: rule.stage,
        priority: rule.priority
      });

      return rule;
    }

    unregisterRule(id) {
      const removed = this.rules.delete(normalizeString(id));

      if (removed) {
        emit("media:validation:rule:removed", {
          ruleId: normalizeString(id)
        });
      }

      return removed;
    }

    enableRule(id) {
      const rule = this.rules.get(normalizeString(id));

      if (!rule) {
        return false;
      }

      rule.enabled = true;
      return true;
    }

    disableRule(id) {
      const rule = this.rules.get(normalizeString(id));

      if (!rule) {
        return false;
      }

      rule.enabled = false;
      return true;
    }

    listRules() {
      return Array.from(this.rules.values())
        .sort((a, b) => a.priority - b.priority)
        .map((rule) => ({
          id: rule.id,
          label: rule.label,
          stage: rule.stage,
          priority: rule.priority,
          enabled: rule.enabled,
          categories: rule.categories.slice()
        }));
    }

    resolveRules(profile) {
      const allRules = Array.from(this.rules.values());

      const customRules = Array.isArray(profile.customRules)
        ? profile.customRules
        : [];

      for (const customRule of customRules) {
        if (customRule instanceof ValidationRule) {
          allRules.push(customRule);
        } else if (
          customRule &&
          typeof customRule.validator === "function"
        ) {
          allRules.push(new ValidationRule(customRule));
        }
      }

      return allRules
        .filter((rule) => rule.enabled)
        .sort((a, b) => a.priority - b.priority);
    }

    async validate(file, options) {
      const config = options || {};
      const profile = this.profileManager.resolve(
        config.profile || config.profileId
      );

      const useCache = config.useCache !== false;

      if (useCache) {
        const cached = this.cache.get(file, profile.id);

        if (cached) {
          emit("media:validation:cache-hit", {
            file,
            profileId: profile.id,
            result: cached
          });

          return cached;
        }
      }

      const result = new ValidationResult(file, profile);
      const controller = new AbortController();

      if (config.signal) {
        if (config.signal.aborted) {
          controller.abort(
            config.signal.reason || createAbortError()
          );
        } else {
          config.signal.addEventListener(
            "abort",
            () => {
              controller.abort(
                config.signal.reason || createAbortError()
              );
            },
            {
              once: true
            }
          );
        }
      }

      this.activeControllers.set(result.id, controller);

      const context = {
        id: result.id,
        file,
        profile,
        result,
        signal: controller.signal,
        engine: this,
        signatureInspector: this.signatureInspector,
        metadataInspector: this.metadataInspector,
        securityHooks: this.securityHooks,
        duplicateDetector: this.duplicateDetector,
        options: config
      };

      result.start();

      emit("media:validation:start", {
        file,
        profile,
        result
      });

      syncStore(
        `mediaLibrary.validation.active.${result.id}`,
        result.toJSON()
      );

      try {
        if (!isFile(file)) {
          result.addError(
            "INVALID_FILE_OBJECT",
            "A valid File object is required.",
            {
              stage: VALIDATION_STAGE.BASIC
            }
          );

          result.complete();
          return result;
        }

        const rules = this.resolveRules(profile);

        for (const rule of rules) {
          throwIfAborted(controller.signal);

          result.setStage(rule.stage);

          emit("media:validation:stage", {
            file,
            result,
            ruleId: rule.id,
            stage: rule.stage
          });

          await rule.run(context);

          syncStore(
            `mediaLibrary.validation.active.${result.id}`,
            result.toJSON()
          );

          if (
            config.stopOnFirstError === true &&
            result.errors.length > 0
          ) {
            break;
          }
        }

        result.complete();

        if (useCache) {
          this.cache.set(file, profile.id, result);
        }

        emit("media:validation:complete", {
          file,
          profile,
          result
        });

        if (!result.valid && config.notify !== false) {
          notify(
            "error",
            `${file.name} could not be added because it failed validation.`,
            {
              duration: 6000,
              metadata: {
                validationId: result.id,
                errors: result.errors.map((issue) => issue.toJSON())
              }
            }
          );
        } else if (
          result.warnings.length > 0 &&
          config.notifyWarnings === true
        ) {
          notify(
            "warning",
            `${file.name} was validated with warnings.`,
            {
              duration: 5000,
              metadata: {
                validationId: result.id,
                warnings: result.warnings.map((issue) => issue.toJSON())
              }
            }
          );
        }

        return result;
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error && error.name === "AbortError")
        ) {
          result.cancel();

          emit("media:validation:cancelled", {
            file,
            profile,
            result
          });

          return result;
        }

        result.fail(error);

        emit("media:validation:failed", {
          file,
          profile,
          result,
          error
        });

        if (config.notify !== false) {
          notify(
            "error",
            `Validation failed for ${file && file.name ? file.name : "the selected file"}.`,
            {
              duration: 6000
            }
          );
        }

        return result;
      } finally {
        this.activeControllers.delete(result.id);

        syncStore(
          `mediaLibrary.validation.active.${result.id}`,
          null
        );

        syncStore(
          `mediaLibrary.validation.results.${result.id}`,
          result.toJSON()
        );
      }
    }

    async validateBatch(files, options) {
      const config = options || {};
      const fileList = Array.from(files || []).filter(isFile);
      const concurrency = clamp(
        Number.isFinite(config.concurrency)
          ? config.concurrency
          : this.batchConcurrency,
        1,
        Math.max(1, fileList.length)
      );

      const results = new Array(fileList.length);
      let nextIndex = 0;
      let completed = 0;
      let valid = 0;
      let invalid = 0;
      let warnings = 0;

      const batchId = createId("validation_batch");

      emit("media:validation:batch:start", {
        batchId,
        total: fileList.length
      });

      const worker = async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;

          if (index >= fileList.length) {
            return;
          }

          throwIfAborted(config.signal);

          const result = await this.validate(fileList[index], {
            ...config,
            notify: false
          });

          results[index] = result;
          completed += 1;

          if (result.valid) {
            valid += 1;
          } else {
            invalid += 1;
          }

          if (result.warnings.length > 0) {
            warnings += 1;
          }

          const progress = fileList.length
            ? completed / fileList.length
            : 1;

          emit("media:validation:batch:progress", {
            batchId,
            total: fileList.length,
            completed,
            valid,
            invalid,
            warnings,
            progress,
            result,
            file: fileList[index]
          });

          if (typeof config.onProgress === "function") {
            await config.onProgress({
              batchId,
              total: fileList.length,
              completed,
              valid,
              invalid,
              warnings,
              progress,
              result,
              file: fileList[index],
              index
            });
          }
        }
      };

      const workers = Array.from(
        {
          length: concurrency
        },
        () => worker()
      );

      try {
        await Promise.all(workers);
      } catch (error) {
        if (
          config.signal &&
          config.signal.aborted
        ) {
          emit("media:validation:batch:cancelled", {
            batchId,
            total: fileList.length,
            completed,
            valid,
            invalid,
            warnings
          });
        } else {
          emit("media:validation:batch:failed", {
            batchId,
            error,
            total: fileList.length,
            completed
          });
        }

        throw error;
      }

      const summary = {
        batchId,
        total: fileList.length,
        completed,
        valid,
        invalid,
        warnings,
        results,
        acceptedFiles: fileList.filter(
          (file, index) => results[index] && results[index].valid
        ),
        rejectedFiles: fileList.filter(
          (file, index) => !results[index] || !results[index].valid
        )
      };

      emit("media:validation:batch:complete", summary);

      syncStore(
        `mediaLibrary.validation.batches.${batchId}`,
        {
          batchId,
          total: summary.total,
          completed: summary.completed,
          valid: summary.valid,
          invalid: summary.invalid,
          warnings: summary.warnings,
          results: summary.results.map((result) =>
            result ? result.toJSON() : null
          )
        }
      );

      if (
        config.notify !== false &&
        summary.rejectedFiles.length > 0
      ) {
        notify(
          "warning",
          `${summary.rejectedFiles.length} file${
            summary.rejectedFiles.length === 1 ? "" : "s"
          } could not be added.`,
          {
            duration: 6000
          }
        );
      }

      return summary;
    }

    cancel(validationId, reason) {
      const controller = this.activeControllers.get(
        normalizeString(validationId)
      );

      if (!controller) {
        return false;
      }

      controller.abort(
        reason instanceof Error
          ? reason
          : new Error(
              normalizeString(reason) || "Validation cancelled."
            )
      );

      return true;
    }

    cancelAll(reason) {
      let cancelled = 0;

      for (const controller of this.activeControllers.values()) {
        if (!controller.signal.aborted) {
          controller.abort(
            reason instanceof Error
              ? reason
              : new Error(
                  normalizeString(reason) ||
                    "All validations were cancelled."
                )
          );

          cancelled += 1;
        }
      }

      return cancelled;
    }

    clearCache() {
      this.cache.clear();
    }

    getSnapshot() {
      return {
        initialized: true,
        activeValidations: this.activeControllers.size,
        cacheSize: this.cache.size,
        profiles: this.profileManager.list(),
        rules: this.listRules(),
        securityHooks: this.securityHooks.list()
      };
    }
  }

  /* =========================================================
     UPLOAD QUEUE INTEGRATION
  ========================================================= */

  class ValidationUploadIntegration {
    constructor(engine) {
      this.engine = engine;
      this.enabled = true;
      this.bound = false;
      this.unsubscribe = [];
    }

    bind() {
      if (this.bound) {
        return this;
      }

      this.bound = true;

      const queue = uploads.queue || uploads.uploadQueue;

      if (
        queue &&
        typeof queue.setValidator === "function"
      ) {
        queue.setValidator(async (file, options) => {
          const result = await this.engine.validate(
            file,
            options
          );

          return {
            valid: result.valid,
            result
          };
        });
      }

      if (
        queue &&
        typeof queue.use === "function"
      ) {
        const middleware = async (context, next) => {
          if (!this.enabled) {
            return next();
          }

          const file =
            context.file ||
            (context.item && context.item.file);

          if (!isFile(file)) {
            return next();
          }

          const result = await this.engine.validate(
            file,
            {
              profile:
                context.validationProfile ||
                context.profile,
              signal: context.signal,
              notify: false
            }
          );

          context.validation = result;

          if (!result.valid) {
            const error = new Error(
              "The file failed validation."
            );

            error.name = "UploadValidationError";
            error.validation = result;

            throw error;
          }

          return next();
        };

        const unbind = queue.use(middleware);

        if (typeof unbind === "function") {
          this.unsubscribe.push(unbind);
        }
      }

      emit("media:validation:integration:bound", {
        integration: "upload-queue"
      });

      return this;
    }

    unbind() {
      while (this.unsubscribe.length > 0) {
        const unsubscribe = this.unsubscribe.pop();

        try {
          unsubscribe();
        } catch (error) {
          console.error(
            "[AIFTMediaLibrary] Validation integration cleanup failed.",
            error
          );
        }
      }

      this.bound = false;

      emit("media:validation:integration:unbound", {
        integration: "upload-queue"
      });

      return this;
    }

    enable() {
      this.enabled = true;
      return this;
    }

    disable() {
      this.enabled = false;
      return this;
    }
  }

  /* =========================================================
     PUBLIC INITIALIZATION
  ========================================================= */

  const validationEngine = new FileValidationEngine();
  const uploadIntegration =
    new ValidationUploadIntegration(validationEngine);

  uploadIntegration.bind();

  const validationApi = {
    constants: {
      severity: VALIDATION_SEVERITY,
      status: VALIDATION_STATUS,
      stage: VALIDATION_STAGE,
      category: FILE_CATEGORY
    },

    engine: validationEngine,
    profiles: validationEngine.profileManager,
    rules: validationEngine.rules,
    cache: validationEngine.cache,
    signatures: validationEngine.signatureInspector,
    securityHooks: validationEngine.securityHooks,
    duplicateDetector: validationEngine.duplicateDetector,
    uploadIntegration,

    validate(file, options) {
      return validationEngine.validate(file, options);
    },

    validateBatch(files, options) {
      return validationEngine.validateBatch(files, options);
    },

    registerProfile(profile) {
      return validationEngine.profileManager.register(profile);
    },

    updateProfile(id, updates) {
      return validationEngine.profileManager.update(id, updates);
    },

    removeProfile(id) {
      return validationEngine.profileManager.remove(id);
    },

    getProfile(id) {
      return validationEngine.profileManager.get(id);
    },

    listProfiles() {
      return validationEngine.profileManager.list();
    },

    setDefaultProfile(id) {
      return validationEngine.profileManager.setDefault(id);
    },

    registerRule(rule) {
      return validationEngine.registerRule(rule);
    },

    unregisterRule(id) {
      return validationEngine.unregisterRule(id);
    },

    enableRule(id) {
      return validationEngine.enableRule(id);
    },

    disableRule(id) {
      return validationEngine.disableRule(id);
    },

    listRules() {
      return validationEngine.listRules();
    },

    registerSecurityHook(id, handler, options) {
      return validationEngine.securityHooks.register(
        id,
        handler,
        options
      );
    },

    unregisterSecurityHook(id) {
      return validationEngine.securityHooks.unregister(id);
    },

    sanitizeFilename(filename, options) {
      return sanitizeFilename(filename, options);
    },

    inferCategory(file) {
      return inferCategory(file);
    },

    inspectSignature(file, options) {
      return validationEngine.signatureInspector.inspect(
        file,
        options
      );
    },

    cancel(validationId, reason) {
      return validationEngine.cancel(validationId, reason);
    },

    cancelAll(reason) {
      return validationEngine.cancelAll(reason);
    },

    clearCache() {
      return validationEngine.clearCache();
    },

    getSnapshot() {
      return validationEngine.getSnapshot();
    },

    createRule(options) {
      return new ValidationRule(options);
    },

    createIssue(options) {
      return new ValidationIssue(options);
    }
  };

  uploads.validation = validationApi;
  uploads.validationEngine = validationEngine;

  mediaLibrary.validation = validationApi;
  mediaLibrary.fileValidation = validationApi;
  mediaLibrary.fileValidationEngine = validationEngine;

  mediaLibrary.validateMediaFile = function validateMediaFile(
    file,
    options
  ) {
    return validationEngine.validate(file, options);
  };

  mediaLibrary.validateMediaFiles = function validateMediaFiles(
    files,
    options
  ) {
    return validationEngine.validateBatch(files, options);
  };

  mediaLibrary.registerMediaValidationProfile =
    function registerMediaValidationProfile(profile) {
      return validationEngine.profileManager.register(profile);
    };

  mediaLibrary.registerMediaValidationRule =
    function registerMediaValidationRule(rule) {
      return validationEngine.registerRule(rule);
    };

  mediaLibrary.registerMediaSecurityHook =
    function registerMediaSecurityHook(id, handler, options) {
      return validationEngine.securityHooks.register(
        id,
        handler,
        options
      );
    };

  mediaLibrary.getMediaValidationSnapshot =
    function getMediaValidationSnapshot() {
      return validationEngine.getSnapshot();
    };

  mediaLibrary.__fileValidationEngineInitialized = true;

  emit("media:validation:initialized", {
    engine: validationEngine,
    snapshot: validationEngine.getSnapshot()
  });
})(window);
/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2F OF 15
   THUMBNAIL GENERATION ENGINE
========================================================= */

(function initializeAIFTThumbnailGenerationEngine(global) {
  "use strict";

  const mediaLibrary = global.AIFTMediaLibrary;

  if (!mediaLibrary) {
    throw new Error(
      "AIFTMediaLibrary must be initialized before loading Part 2F."
    );
  }

  if (mediaLibrary.__thumbnailGenerationEngineInitialized) {
    return;
  }

  const uploads = mediaLibrary.uploads || (mediaLibrary.uploads = {});
  const eventBus = mediaLibrary.events || mediaLibrary.eventBus || null;
  const store = mediaLibrary.store || null;
  const notifications = mediaLibrary.notifications || null;
  const validationApi =
    mediaLibrary.validation ||
    mediaLibrary.fileValidation ||
    uploads.validation ||
    null;

  /* =========================================================
     CONSTANTS
  ========================================================= */

  const THUMBNAIL_STATUS = Object.freeze({
    PENDING: "pending",
    QUEUED: "queued",
    PROCESSING: "processing",
    READY: "ready",
    FAILED: "failed",
    CANCELLED: "cancelled",
    UNSUPPORTED: "unsupported"
  });

  const THUMBNAIL_SOURCE = Object.freeze({
    IMAGE: "image",
    VIDEO: "video",
    AUDIO: "audio",
    DOCUMENT: "document",
    GENERIC: "generic"
  });

  const THUMBNAIL_OUTPUT = Object.freeze({
    BLOB: "blob",
    DATA_URL: "data-url",
    OBJECT_URL: "object-url",
    CANVAS: "canvas",
    BITMAP: "bitmap"
  });

  const THUMBNAIL_FIT = Object.freeze({
    COVER: "cover",
    CONTAIN: "contain",
    STRETCH: "stretch"
  });

  const THUMBNAIL_FORMAT = Object.freeze({
    JPEG: "image/jpeg",
    PNG: "image/png",
    WEBP: "image/webp"
  });

  const DEFAULT_OPTIONS = Object.freeze({
    width: 640,
    height: 360,
    fit: THUMBNAIL_FIT.COVER,
    format: THUMBNAIL_FORMAT.JPEG,
    quality: 0.86,
    background: "#ffffff",
    preserveTransparency: false,
    upscale: false,
    videoTime: null,
    videoPercentage: 0.25,
    videoSeekTimeoutMs: 12000,
    decodeTimeoutMs: 15000,
    maxSourcePixels: 120000000,
    output: THUMBNAIL_OUTPUT.BLOB,
    includeMetadata: true,
    useCache: true,
    cacheTtlMs: 30 * 60 * 1000,
    cacheMaxEntries: 300,
    concurrency: 3,
    validateBeforeProcessing: true,
    rejectInvalidFiles: true,
    notifyOnFailure: false
  });

  const DOCUMENT_EXTENSIONS = new Set([
    "pdf",
    "doc",
    "docx",
    "odt",
    "rtf",
    "txt",
    "md"
  ]);

  const PRESENTATION_EXTENSIONS = new Set([
    "ppt",
    "pptx",
    "odp",
    "key"
  ]);

  const SPREADSHEET_EXTENSIONS = new Set([
    "xls",
    "xlsx",
    "ods",
    "csv"
  ]);

  const ARCHIVE_EXTENSIONS = new Set([
    "zip",
    "rar",
    "7z",
    "gz",
    "tar"
  ]);

  const AUDIO_EXTENSIONS = new Set([
    "mp3",
    "wav",
    "ogg",
    "oga",
    "m4a",
    "aac",
    "flac",
    "opus"
  ]);

  const IMAGE_EXTENSIONS = new Set([
    "jpg",
    "jpeg",
    "jpe",
    "png",
    "gif",
    "webp",
    "avif",
    "bmp",
    "tif",
    "tiff",
    "svg",
    "ico",
    "heic",
    "heif"
  ]);

  const VIDEO_EXTENSIONS = new Set([
    "mp4",
    "m4v",
    "mov",
    "webm",
    "mkv",
    "avi",
    "mpg",
    "mpeg",
    "ogv"
  ]);

  /* =========================================================
     UTILITIES
  ========================================================= */

  function now() {
    return Date.now();
  }

  function createId(prefix) {
    const random =
      global.crypto &&
      typeof global.crypto.randomUUID === "function"
        ? global.crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    return `${prefix || "thumbnail"}_${random}`;
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeMime(value) {
    return normalizeString(value).toLowerCase().split(";")[0].trim();
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function isBlob(value) {
    return typeof Blob !== "undefined" && value instanceof Blob;
  }

  function isFile(value) {
    return typeof File !== "undefined" && value instanceof File;
  }

  function getExtension(filename) {
    const value = normalizeString(filename);
    const index = value.lastIndexOf(".");

    if (index <= 0 || index === value.length - 1) {
      return "";
    }

    return value.slice(index + 1).toLowerCase();
  }

  function createAbortError(message) {
    try {
      return new DOMException(
        message || "Thumbnail generation aborted.",
        "AbortError"
      );
    } catch (error) {
      const abortError = new Error(
        message || "Thumbnail generation aborted."
      );

      abortError.name = "AbortError";
      return abortError;
    }
  }

  function throwIfAborted(signal) {
    if (signal && signal.aborted) {
      throw signal.reason || createAbortError();
    }
  }

  function emit(name, payload) {
    if (!eventBus) {
      return;
    }

    try {
      if (typeof eventBus.emit === "function") {
        eventBus.emit(name, payload);
      } else if (typeof eventBus.dispatch === "function") {
        eventBus.dispatch(name, payload);
      } else if (typeof eventBus.publish === "function") {
        eventBus.publish(name, payload);
      }
    } catch (error) {
      console.error(
        `[AIFTMediaLibrary] Event emission failed: ${name}`,
        error
      );
    }
  }

  function notify(type, message, options) {
    if (!notifications) {
      return;
    }

    try {
      if (typeof notifications[type] === "function") {
        notifications[type](message, options);
      } else if (typeof notifications.show === "function") {
        notifications.show({
          type,
          message,
          ...(options || {})
        });
      }
    } catch (error) {
      console.error(
        "[AIFTMediaLibrary] Thumbnail notification failed.",
        error
      );
    }
  }

  function syncStore(path, value) {
    if (!store) {
      return;
    }

    try {
      if (typeof store.set === "function") {
        store.set(path, value);
      } else if (typeof store.update === "function") {
        store.update(path, value);
      } else if (typeof store.dispatch === "function") {
        store.dispatch({
          type: "MEDIA_THUMBNAIL_UPDATE",
          payload: {
            path,
            value
          }
        });
      }
    } catch (error) {
      console.error(
        "[AIFTMediaLibrary] Thumbnail store synchronization failed.",
        error
      );
    }
  }

  function mergeOptions(base, override) {
    const options = {
      ...(base || {}),
      ...(override || {})
    };

    options.width = clamp(
      Number.isFinite(Number(options.width))
        ? Math.round(Number(options.width))
        : DEFAULT_OPTIONS.width,
      1,
      8192
    );

    options.height = clamp(
      Number.isFinite(Number(options.height))
        ? Math.round(Number(options.height))
        : DEFAULT_OPTIONS.height,
      1,
      8192
    );

    options.quality = clamp(
      Number.isFinite(Number(options.quality))
        ? Number(options.quality)
        : DEFAULT_OPTIONS.quality,
      0.01,
      1
    );

    options.videoPercentage = clamp(
      Number.isFinite(Number(options.videoPercentage))
        ? Number(options.videoPercentage)
        : DEFAULT_OPTIONS.videoPercentage,
      0,
      1
    );

    if (!Object.values(THUMBNAIL_FIT).includes(options.fit)) {
      options.fit = DEFAULT_OPTIONS.fit;
    }

    if (!Object.values(THUMBNAIL_OUTPUT).includes(options.output)) {
      options.output = DEFAULT_OPTIONS.output;
    }

    if (!Object.values(THUMBNAIL_FORMAT).includes(options.format)) {
      options.format = DEFAULT_OPTIONS.format;
    }

    return options;
  }

  function inferSourceType(file) {
    const mime = normalizeMime(file && file.type);
    const extension = getExtension(file && file.name);

    if (
      mime.startsWith("image/") ||
      IMAGE_EXTENSIONS.has(extension)
    ) {
      return THUMBNAIL_SOURCE.IMAGE;
    }

    if (
      mime.startsWith("video/") ||
      VIDEO_EXTENSIONS.has(extension)
    ) {
      return THUMBNAIL_SOURCE.VIDEO;
    }

    if (
      mime.startsWith("audio/") ||
      AUDIO_EXTENSIONS.has(extension)
    ) {
      return THUMBNAIL_SOURCE.AUDIO;
    }

    if (
      mime === "application/pdf" ||
      DOCUMENT_EXTENSIONS.has(extension) ||
      PRESENTATION_EXTENSIONS.has(extension) ||
      SPREADSHEET_EXTENSIONS.has(extension)
    ) {
      return THUMBNAIL_SOURCE.DOCUMENT;
    }

    return THUMBNAIL_SOURCE.GENERIC;
  }

  function createCanvas(width, height) {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height);
    }

    if (typeof document === "undefined") {
      throw new Error(
        "Canvas rendering is unavailable in this environment."
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    return canvas;
  }

  function getCanvasContext(canvas) {
    const context = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: false
    });

    if (!context) {
      throw new Error("Unable to create a 2D canvas context.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    return context;
  }

  function canvasToBlob(canvas, format, quality) {
    if (
      typeof canvas.convertToBlob === "function"
    ) {
      return canvas.convertToBlob({
        type: format,
        quality
      });
    }

    return new Promise((resolve, reject) => {
      if (typeof canvas.toBlob !== "function") {
        reject(
          new Error("Canvas blob export is unavailable.")
        );

        return;
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error("Canvas could not be converted to a Blob.")
            );

            return;
          }

          resolve(blob);
        },
        format,
        quality
      );
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          reader.error ||
            new Error("Unable to convert thumbnail to a data URL.")
        );
      };

      reader.onabort = () => {
        reject(createAbortError());
      };

      reader.readAsDataURL(blob);
    });
  }

  async function createBitmapFromCanvas(canvas) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(canvas);
    }

    throw new Error(
      "ImageBitmap output is unavailable in this environment."
    );
  }

  function calculateDrawRectangle(
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    fit,
    upscale
  ) {
    if (
      sourceWidth <= 0 ||
      sourceHeight <= 0 ||
      targetWidth <= 0 ||
      targetHeight <= 0
    ) {
      throw new Error("Invalid thumbnail dimensions.");
    }

    if (fit === THUMBNAIL_FIT.STRETCH) {
      return {
        sourceX: 0,
        sourceY: 0,
        sourceWidth,
        sourceHeight,
        targetX: 0,
        targetY: 0,
        targetWidth,
        targetHeight
      };
    }

    const widthRatio = targetWidth / sourceWidth;
    const heightRatio = targetHeight / sourceHeight;

    let scale =
      fit === THUMBNAIL_FIT.CONTAIN
        ? Math.min(widthRatio, heightRatio)
        : Math.max(widthRatio, heightRatio);

    if (!upscale) {
      scale = Math.min(scale, 1);
    }

    const drawnWidth = sourceWidth * scale;
    const drawnHeight = sourceHeight * scale;

    if (fit === THUMBNAIL_FIT.CONTAIN) {
      return {
        sourceX: 0,
        sourceY: 0,
        sourceWidth,
        sourceHeight,
        targetX: (targetWidth - drawnWidth) / 2,
        targetY: (targetHeight - drawnHeight) / 2,
        targetWidth: drawnWidth,
        targetHeight: drawnHeight
      };
    }

    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = targetWidth / targetHeight;

    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (sourceAspect > targetAspect) {
      cropWidth = sourceHeight * targetAspect;
      sourceX = (sourceWidth - cropWidth) / 2;
    } else if (sourceAspect < targetAspect) {
      cropHeight = sourceWidth / targetAspect;
      sourceY = (sourceHeight - cropHeight) / 2;
    }

    return {
      sourceX,
      sourceY,
      sourceWidth: cropWidth,
      sourceHeight: cropHeight,
      targetX: 0,
      targetY: 0,
      targetWidth,
      targetHeight
    };
  }

  function waitForEvent(target, successEvent, failureEvents, timeoutMs, signal) {
    return new Promise((resolve, reject) => {
      let timer = null;
      let settled = false;

      const failures = Array.isArray(failureEvents)
        ? failureEvents
        : [failureEvents].filter(Boolean);

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        target.removeEventListener(successEvent, handleSuccess);

        for (const eventName of failures) {
          target.removeEventListener(eventName, handleFailure);
        }

        if (signal) {
          signal.removeEventListener("abort", handleAbort);
        }
      };

      const settle = (handler, value) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        handler(value);
      };

      const handleSuccess = (event) => {
        settle(resolve, event);
      };

      const handleFailure = () => {
        settle(
          reject,
          new Error(
            `Media element failed while waiting for "${successEvent}".`
          )
        );
      };

      const handleAbort = () => {
        settle(
          reject,
          signal.reason || createAbortError()
        );
      };

      target.addEventListener(successEvent, handleSuccess, {
        once: true
      });

      for (const eventName of failures) {
        target.addEventListener(eventName, handleFailure, {
          once: true
        });
      }

      if (signal) {
        if (signal.aborted) {
          handleAbort();
          return;
        }

        signal.addEventListener("abort", handleAbort, {
          once: true
        });
      }

      if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timer = setTimeout(() => {
          settle(
            reject,
            new Error(
              `Timed out while waiting for "${successEvent}".`
            )
          );
        }, timeoutMs);
      }
    });
  }

  function formatFileSize(bytes) {
    const value = Number(bytes) || 0;

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    if (value < 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /* =========================================================
     RESULT MODEL
  ========================================================= */

  class ThumbnailResult {
    constructor(file, options) {
      this.id = createId("thumbnail");
      this.file = file;
      this.fileName = file ? file.name : "";
      this.sourceMime = file ? normalizeMime(file.type) : "";
      this.sourceSize = file ? file.size : 0;
      this.sourceType = inferSourceType(file);
      this.status = THUMBNAIL_STATUS.PENDING;
      this.options = {
        ...options
      };
      this.width = options.width;
      this.height = options.height;
      this.format = options.format;
      this.outputType = options.output;
      this.output = null;
      this.blob = null;
      this.objectUrl = null;
      this.dataUrl = null;
      this.canvas = null;
      this.bitmap = null;
      this.metadata = {};
      this.error = null;
      this.createdAt = now();
      this.startedAt = null;
      this.completedAt = null;
      this.durationMs = 0;
      this.fromCache = false;
    }

    start() {
      this.status = THUMBNAIL_STATUS.PROCESSING;
      this.startedAt = now();

      return this;
    }

    complete() {
      this.status = THUMBNAIL_STATUS.READY;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    fail(error) {
      this.status = THUMBNAIL_STATUS.FAILED;
      this.error = {
        name:
          error && error.name
            ? error.name
            : "Error",
        message:
          error && error.message
            ? error.message
            : String(error || "Thumbnail generation failed."),
        stack:
          error && error.stack
            ? error.stack
            : null
      };
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    cancel() {
      this.status = THUMBNAIL_STATUS.CANCELLED;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    unsupported() {
      this.status = THUMBNAIL_STATUS.UNSUPPORTED;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    revokeObjectUrl() {
      if (
        this.objectUrl &&
        typeof URL !== "undefined" &&
        typeof URL.revokeObjectURL === "function"
      ) {
        URL.revokeObjectURL(this.objectUrl);
      }

      this.objectUrl = null;

      if (
        this.outputType === THUMBNAIL_OUTPUT.OBJECT_URL
      ) {
        this.output = null;
      }
    }

    closeBitmap() {
      if (
        this.bitmap &&
        typeof this.bitmap.close === "function"
      ) {
        this.bitmap.close();
      }

      this.bitmap = null;

      if (this.outputType === THUMBNAIL_OUTPUT.BITMAP) {
        this.output = null;
      }
    }

    dispose() {
      this.revokeObjectUrl();
      this.closeBitmap();
      this.canvas = null;
      this.dataUrl = null;
      this.output = null;
    }

    toJSON() {
      return {
        id: this.id,
        fileName: this.fileName,
        sourceMime: this.sourceMime,
        sourceSize: this.sourceSize,
        sourceType: this.sourceType,
        status: this.status,
        width: this.width,
        height: this.height,
        format: this.format,
        outputType: this.outputType,
        objectUrl: this.objectUrl,
        dataUrl:
          this.outputType === THUMBNAIL_OUTPUT.DATA_URL
            ? this.dataUrl
            : null,
        metadata: this.metadata,
        error: this.error,
        createdAt: this.createdAt,
        startedAt: this.startedAt,
        completedAt: this.completedAt,
        durationMs: this.durationMs,
        fromCache: this.fromCache
      };
    }
  }

  /* =========================================================
     CACHE
  ========================================================= */

  class ThumbnailCache {
    constructor(options) {
      const config = options || {};

      this.ttlMs = Number.isFinite(config.ttlMs)
        ? Math.max(0, config.ttlMs)
        : DEFAULT_OPTIONS.cacheTtlMs;

      this.maxEntries = Number.isFinite(config.maxEntries)
        ? Math.max(1, config.maxEntries)
        : DEFAULT_OPTIONS.cacheMaxEntries;

      this.entries = new Map();
    }

    createKey(file, options) {
      return [
        normalizeString(file && file.name),
        Number(file && file.size) || 0,
        Number(file && file.lastModified) || 0,
        normalizeMime(file && file.type),
        options.width,
        options.height,
        options.fit,
        options.format,
        options.quality,
        options.background,
        options.preserveTransparency,
        options.upscale,
        options.videoTime,
        options.videoPercentage,
        options.output
      ].join("::");
    }

    get(file, options) {
      const key = this.createKey(file, options);
      const entry = this.entries.get(key);

      if (!entry) {
        return null;
      }

      if (
        this.ttlMs > 0 &&
        now() - entry.createdAt > this.ttlMs
      ) {
        this.deleteByKey(key);
        return null;
      }

      this.entries.delete(key);
      this.entries.set(key, entry);

      return entry.result;
    }

    set(file, options, result) {
      const key = this.createKey(file, options);

      if (this.entries.has(key)) {
        this.deleteByKey(key);
      }

      this.entries.set(key, {
        createdAt: now(),
        result
      });

      while (this.entries.size > this.maxEntries) {
        const oldestKey = this.entries.keys().next().value;
        this.deleteByKey(oldestKey);
      }

      return result;
    }

    deleteByKey(key) {
      const entry = this.entries.get(key);

      if (!entry) {
        return false;
      }

      if (
        entry.result &&
        typeof entry.result.dispose === "function"
      ) {
        entry.result.dispose();
      }

      return this.entries.delete(key);
    }

    delete(file, options) {
      return this.deleteByKey(
        this.createKey(file, options)
      );
    }

    clear() {
      for (const key of this.entries.keys()) {
        this.deleteByKey(key);
      }
    }

    prune() {
      if (this.ttlMs <= 0) {
        return 0;
      }

      let removed = 0;
      const timestamp = now();

      for (const [key, entry] of this.entries.entries()) {
        if (timestamp - entry.createdAt > this.ttlMs) {
          this.deleteByKey(key);
          removed += 1;
        }
      }

      return removed;
    }

    get size() {
      return this.entries.size;
    }
  }

  /* =========================================================
     IMAGE DECODER
  ========================================================= */

  class ImageDecoder {
    async decode(file, options) {
      const config = options || {};
      const signal = config.signal;

      throwIfAborted(signal);

      if (
        typeof createImageBitmap === "function" &&
        !normalizeMime(file.type).includes("svg")
      ) {
        const bitmap = await createImageBitmap(file);

        throwIfAborted(signal);

        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          type: "bitmap",
          dispose() {
            if (typeof bitmap.close === "function") {
              bitmap.close();
            }
          }
        };
      }

      if (
        typeof document === "undefined" ||
        typeof URL === "undefined"
      ) {
        throw new Error(
          "Image decoding is unavailable in this environment."
        );
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.decoding = "async";

      if (config.crossOrigin) {
        image.crossOrigin = config.crossOrigin;
      }

      try {
        const loaded = waitForEvent(
          image,
          "load",
          "error",
          config.decodeTimeoutMs,
          signal
        );

        image.src = objectUrl;

        await loaded;

        throwIfAborted(signal);

        const width =
          image.naturalWidth ||
          image.width ||
          0;

        const height =
          image.naturalHeight ||
          image.height ||
          0;

        if (width <= 0 || height <= 0) {
          throw new Error(
            "The image did not report valid dimensions."
          );
        }

        return {
          source: image,
          width,
          height,
          type: "image-element",
          dispose() {
            image.removeAttribute("src");
            URL.revokeObjectURL(objectUrl);
          }
        };
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
      }
    }
  }

  /* =========================================================
     VIDEO FRAME DECODER
  ========================================================= */

  class VideoFrameDecoder {
    async decode(file, options) {
      const config = options || {};
      const signal = config.signal;

      throwIfAborted(signal);

      if (
        typeof document === "undefined" ||
        typeof URL === "undefined"
      ) {
        throw new Error(
          "Video thumbnail generation is unavailable in this environment."
        );
      }

      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      try {
        const metadataLoaded = waitForEvent(
          video,
          "loadedmetadata",
          ["error", "abort"],
          config.decodeTimeoutMs,
          signal
        );

        video.src = objectUrl;

        await metadataLoaded;

        throwIfAborted(signal);

        const duration = Number.isFinite(video.duration)
          ? video.duration
          : 0;

        let seekTime = Number.isFinite(config.videoTime)
          ? config.videoTime
          : duration * config.videoPercentage;

        if (!Number.isFinite(seekTime)) {
          seekTime = 0;
        }

        if (duration > 0) {
          seekTime = clamp(
            seekTime,
            0,
            Math.max(0, duration - 0.05)
          );
        } else {
          seekTime = 0;
        }

        if (Math.abs(video.currentTime - seekTime) > 0.001) {
          const seeked = waitForEvent(
            video,
            "seeked",
            ["error", "abort"],
            config.videoSeekTimeoutMs,
            signal
          );

          video.currentTime = seekTime;

          await seeked;
        }

        if (
          video.readyState < 2
        ) {
          await waitForEvent(
            video,
            "loadeddata",
            ["error", "abort"],
            config.decodeTimeoutMs,
            signal
          );
        }

        throwIfAborted(signal);

        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;

        if (width <= 0 || height <= 0) {
          throw new Error(
            "The video did not report valid dimensions."
          );
        }

        return {
          source: video,
          width,
          height,
          duration,
          currentTime: video.currentTime,
          type: "video-element",
          dispose() {
            video.pause();
            video.removeAttribute("src");

            try {
              video.load();
            } catch (error) {
              void error;
            }

            URL.revokeObjectURL(objectUrl);
          }
        };
      } catch (error) {
        video.pause();
        video.removeAttribute("src");
        URL.revokeObjectURL(objectUrl);
        throw error;
      }
    }
  }

  /* =========================================================
     GENERIC DOCUMENT RENDERER
  ========================================================= */

  class GenericDocumentRenderer {
    constructor() {
      this.customRenderers = new Map();
    }

    register(id, matcher, renderer, options) {
      const normalizedId = normalizeString(id);

      if (!normalizedId) {
        throw new Error(
          "Document thumbnail renderers require an id."
        );
      }

      if (typeof matcher !== "function") {
        throw new TypeError(
          `Renderer "${normalizedId}" requires a matcher function.`
        );
      }

      if (typeof renderer !== "function") {
        throw new TypeError(
          `Renderer "${normalizedId}" requires a renderer function.`
        );
      }

      this.customRenderers.set(normalizedId, {
        id: normalizedId,
        matcher,
        renderer,
        priority:
          Number.isFinite(options && options.priority)
            ? options.priority
            : 100,
        enabled:
          !options ||
          options.enabled !== false
      });

      return normalizedId;
    }

    unregister(id) {
      return this.customRenderers.delete(
        normalizeString(id)
      );
    }

    async render(file, canvas, context, options) {
      const renderers = Array.from(
        this.customRenderers.values()
      )
        .filter((renderer) => renderer.enabled)
        .sort((a, b) => a.priority - b.priority);

      for (const renderer of renderers) {
        if (
          await renderer.matcher(file, options)
        ) {
          const result = await renderer.renderer({
            file,
            canvas,
            context,
            options
          });

          if (result !== false) {
            return {
              rendererId: renderer.id,
              custom: true
            };
          }
        }
      }

      return this.renderFallback(
        file,
        canvas,
        context,
        options
      );
    }

    renderFallback(file, canvas, context, options) {
      const extension = getExtension(file.name);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      const backgroundGradient =
        context.createLinearGradient(
          0,
          0,
          width,
          height
        );

      backgroundGradient.addColorStop(0, "#f8fafc");
      backgroundGradient.addColorStop(1, "#e2e8f0");

      context.fillStyle = backgroundGradient;
      context.fillRect(0, 0, width, height);

      const cardWidth = Math.min(width * 0.52, 260);
      const cardHeight = Math.min(height * 0.64, 310);
      const cardX = centerX - cardWidth / 2;
      const cardY = centerY - cardHeight / 2;

      context.save();
      context.shadowColor = "rgba(15, 23, 42, 0.18)";
      context.shadowBlur = Math.max(12, width * 0.03);
      context.shadowOffsetY = Math.max(6, height * 0.02);
      context.fillStyle = "#ffffff";
      this.roundedRect(
        context,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        Math.max(12, cardWidth * 0.08)
      );
      context.fill();
      context.restore();

      const foldSize = cardWidth * 0.22;

      context.fillStyle = "#e2e8f0";
      context.beginPath();
      context.moveTo(
        cardX + cardWidth - foldSize,
        cardY
      );
      context.lineTo(
        cardX + cardWidth,
        cardY + foldSize
      );
      context.lineTo(
        cardX + cardWidth - foldSize,
        cardY + foldSize
      );
      context.closePath();
      context.fill();

      const label = extension
        ? extension.toUpperCase().slice(0, 6)
        : "FILE";

      const badgeWidth = cardWidth * 0.62;
      const badgeHeight = Math.max(38, cardHeight * 0.16);
      const badgeX = centerX - badgeWidth / 2;
      const badgeY = centerY - badgeHeight / 2;

      context.fillStyle = this.getAccentColor(extension);
      this.roundedRect(
        context,
        badgeX,
        badgeY,
        badgeWidth,
        badgeHeight,
        badgeHeight / 2
      );
      context.fill();

      context.fillStyle = "#ffffff";
      context.font = `700 ${Math.max(
        18,
        Math.min(38, badgeHeight * 0.48)
      )}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        label,
        centerX,
        badgeY + badgeHeight / 2
      );

      context.fillStyle = "#475569";
      context.font = `500 ${Math.max(
        12,
        Math.min(20, width * 0.026)
      )}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "alphabetic";

      const filename = this.truncateText(
        context,
        file.name,
        cardWidth * 0.82
      );

      context.fillText(
        filename,
        centerX,
        cardY + cardHeight - cardHeight * 0.12
      );

      return {
        rendererId: "generic-document",
        custom: false,
        extension,
        label,
        fileSize: formatFileSize(file.size),
        options
      };
    }

    roundedRect(context, x, y, width, height, radius) {
      const normalizedRadius = Math.min(
        radius,
        width / 2,
        height / 2
      );

      context.beginPath();
      context.moveTo(
        x + normalizedRadius,
        y
      );
      context.lineTo(
        x + width - normalizedRadius,
        y
      );
      context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + normalizedRadius
      );
      context.lineTo(
        x + width,
        y + height - normalizedRadius
      );
      context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - normalizedRadius,
        y + height
      );
      context.lineTo(
        x + normalizedRadius,
        y + height
      );
      context.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - normalizedRadius
      );
      context.lineTo(
        x,
        y + normalizedRadius
      );
      context.quadraticCurveTo(
        x,
        y,
        x + normalizedRadius,
        y
      );
      context.closePath();
    }

    truncateText(context, text, maxWidth) {
      const value = normalizeString(text);

      if (context.measureText(value).width <= maxWidth) {
        return value;
      }

      let truncated = value;

      while (
        truncated.length > 1 &&
        context.measureText(`${truncated}…`).width > maxWidth
      ) {
        truncated = truncated.slice(0, -1);
      }

      return `${truncated}…`;
    }

    getAccentColor(extension) {
      if (extension === "pdf") {
        return "#dc2626";
      }

      if (
        ["doc", "docx", "odt", "rtf"].includes(extension)
      ) {
        return "#2563eb";
      }

      if (
        ["xls", "xlsx", "ods", "csv"].includes(extension)
      ) {
        return "#16a34a";
      }

      if (
        ["ppt", "pptx", "odp", "key"].includes(extension)
      ) {
        return "#ea580c";
      }

      if (ARCHIVE_EXTENSIONS.has(extension)) {
        return "#7c3aed";
      }

      if (
        ["txt", "md", "json", "xml"].includes(extension)
      ) {
        return "#475569";
      }

      return "#0f766e";
    }
  }

  /* =========================================================
     AUDIO COVER RENDERER
  ========================================================= */

  class AudioThumbnailRenderer {
    render(file, canvas, context) {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      const gradient = context.createLinearGradient(
        0,
        0,
        width,
        height
      );

      gradient.addColorStop(0, "#111827");
      gradient.addColorStop(0.5, "#1e3a8a");
      gradient.addColorStop(1, "#6d28d9");

      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        Math.max(width, height) * 0.7
      );

      glow.addColorStop(0, "rgba(255,255,255,0.18)");
      glow.addColorStop(1, "rgba(255,255,255,0)");

      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const barCount = 42;
      const availableWidth = width * 0.72;
      const gap = availableWidth / barCount;
      const baseY = centerY + height * 0.08;

      context.save();
      context.lineCap = "round";
      context.strokeStyle = "rgba(255,255,255,0.86)";

      for (let index = 0; index < barCount; index += 1) {
        const phase =
          index / Math.max(1, barCount - 1);

        const amplitude =
          0.25 +
          0.75 *
            Math.abs(
              Math.sin(
                phase * Math.PI * 3.6 +
                  Math.sin(index * 0.42)
              )
            );

        const barHeight =
          height * 0.22 * amplitude;

        const x =
          centerX -
          availableWidth / 2 +
          index * gap +
          gap / 2;

        context.lineWidth = Math.max(
          2,
          gap * 0.32
        );

        context.beginPath();
        context.moveTo(
          x,
          baseY - barHeight / 2
        );
        context.lineTo(
          x,
          baseY + barHeight / 2
        );
        context.stroke();
      }

      context.restore();

      const radius = Math.min(width, height) * 0.12;

      context.fillStyle = "rgba(255,255,255,0.16)";
      context.beginPath();
      context.arc(
        centerX,
        centerY - height * 0.16,
        radius,
        0,
        Math.PI * 2
      );
      context.fill();

      context.strokeStyle = "#ffffff";
      context.lineWidth = Math.max(
        4,
        radius * 0.13
      );
      context.lineCap = "round";
      context.lineJoin = "round";

      context.beginPath();
      context.moveTo(
        centerX - radius * 0.22,
        centerY - height * 0.16 - radius * 0.36
      );
      context.lineTo(
        centerX - radius * 0.22,
        centerY - height * 0.16 + radius * 0.25
      );
      context.quadraticCurveTo(
        centerX - radius * 0.22,
        centerY - height * 0.16 + radius * 0.48,
        centerX - radius * 0.48,
        centerY - height * 0.16 + radius * 0.48
      );
      context.stroke();

      context.beginPath();
      context.moveTo(
        centerX - radius * 0.22,
        centerY - height * 0.16 - radius * 0.3
      );
      context.lineTo(
        centerX + radius * 0.36,
        centerY - height * 0.16 - radius * 0.42
      );
      context.lineTo(
        centerX + radius * 0.36,
        centerY - height * 0.16 + radius * 0.16
      );
      context.quadraticCurveTo(
        centerX + radius * 0.36,
        centerY - height * 0.16 + radius * 0.4,
        centerX + radius * 0.08,
        centerY - height * 0.16 + radius * 0.4
      );
      context.stroke();

      context.fillStyle = "rgba(255,255,255,0.92)";
      context.font = `600 ${Math.max(
        12,
        Math.min(24, width * 0.032)
      )}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      const filename = this.truncateText(
        context,
        file.name,
        width * 0.72
      );

      context.fillText(
        filename,
        centerX,
        height * 0.82
      );

      return {
        rendererId: "audio-cover",
        fileName: file.name,
        extension: getExtension(file.name)
      };
    }

    truncateText(context, text, maxWidth) {
      const value = normalizeString(text);

      if (context.measureText(value).width <= maxWidth) {
        return value;
      }

      let truncated = value;

      while (
        truncated.length > 1 &&
        context.measureText(`${truncated}…`).width > maxWidth
      ) {
        truncated = truncated.slice(0, -1);
      }

      return `${truncated}…`;
    }
  }

  /* =========================================================
     THUMBNAIL PROCESSOR
  ========================================================= */

  class ThumbnailProcessor {
    constructor(options) {
      const config = options || {};

      this.imageDecoder =
        config.imageDecoder ||
        new ImageDecoder();

      this.videoDecoder =
        config.videoDecoder ||
        new VideoFrameDecoder();

      this.documentRenderer =
        config.documentRenderer ||
        new GenericDocumentRenderer();

      this.audioRenderer =
        config.audioRenderer ||
        new AudioThumbnailRenderer();
    }

    async process(file, options, signal) {
      const sourceType = inferSourceType(file);

      if (sourceType === THUMBNAIL_SOURCE.IMAGE) {
        return this.processImage(
          file,
          options,
          signal
        );
      }

      if (sourceType === THUMBNAIL_SOURCE.VIDEO) {
        return this.processVideo(
          file,
          options,
          signal
        );
      }

      if (sourceType === THUMBNAIL_SOURCE.AUDIO) {
        return this.processAudio(
          file,
          options,
          signal
        );
      }

      if (
        sourceType === THUMBNAIL_SOURCE.DOCUMENT ||
        sourceType === THUMBNAIL_SOURCE.GENERIC
      ) {
        return this.processDocument(
          file,
          options,
          signal
        );
      }

      throw new Error(
        "This file type does not support thumbnail generation."
      );
    }

    async processImage(file, options, signal) {
      const decoded = await this.imageDecoder.decode(
        file,
        {
          signal,
          decodeTimeoutMs: options.decodeTimeoutMs
        }
      );

      try {
        throwIfAborted(signal);

        this.assertPixelLimit(
          decoded.width,
          decoded.height,
          options
        );

        const rendered = this.renderSourceToCanvas(
          decoded.source,
          decoded.width,
          decoded.height,
          options
        );

        return {
          canvas: rendered.canvas,
          metadata: {
            renderer: "image",
            sourceWidth: decoded.width,
            sourceHeight: decoded.height,
            sourcePixels:
              decoded.width * decoded.height,
            decoder: decoded.type,
            drawRectangle: rendered.drawRectangle
          }
        };
      } finally {
        decoded.dispose();
      }
    }

    async processVideo(file, options, signal) {
      const decoded = await this.videoDecoder.decode(
        file,
        {
          signal,
          videoTime: options.videoTime,
          videoPercentage: options.videoPercentage,
          videoSeekTimeoutMs: options.videoSeekTimeoutMs,
          decodeTimeoutMs: options.decodeTimeoutMs
        }
      );

      try {
        throwIfAborted(signal);

        this.assertPixelLimit(
          decoded.width,
          decoded.height,
          options
        );

        const rendered = this.renderSourceToCanvas(
          decoded.source,
          decoded.width,
          decoded.height,
          options
        );

        return {
          canvas: rendered.canvas,
          metadata: {
            renderer: "video-frame",
            sourceWidth: decoded.width,
            sourceHeight: decoded.height,
            sourcePixels:
              decoded.width * decoded.height,
            duration: decoded.duration,
            capturedAt: decoded.currentTime,
            decoder: decoded.type,
            drawRectangle: rendered.drawRectangle
          }
        };
      } finally {
        decoded.dispose();
      }
    }

    async processAudio(file, options, signal) {
      throwIfAborted(signal);

      const canvas = createCanvas(
        options.width,
        options.height
      );

      const context = getCanvasContext(canvas);

      const metadata = this.audioRenderer.render(
        file,
        canvas,
        context,
        options
      );

      return {
        canvas,
        metadata
      };
    }

    async processDocument(file, options, signal) {
      throwIfAborted(signal);

      const canvas = createCanvas(
        options.width,
        options.height
      );

      const context = getCanvasContext(canvas);

      const metadata =
        await this.documentRenderer.render(
          file,
          canvas,
          context,
          options
        );

      return {
        canvas,
        metadata
      };
    }

    renderSourceToCanvas(
      source,
      sourceWidth,
      sourceHeight,
      options
    ) {
      const canvas = createCanvas(
        options.width,
        options.height
      );

      const context = getCanvasContext(canvas);

      if (
        !options.preserveTransparency ||
        options.format === THUMBNAIL_FORMAT.JPEG
      ) {
        context.fillStyle =
          normalizeString(options.background) ||
          "#ffffff";

        context.fillRect(
          0,
          0,
          options.width,
          options.height
        );
      } else {
        context.clearRect(
          0,
          0,
          options.width,
          options.height
        );
      }

      const drawRectangle =
        calculateDrawRectangle(
          sourceWidth,
          sourceHeight,
          options.width,
          options.height,
          options.fit,
          options.upscale
        );

      context.drawImage(
        source,
        drawRectangle.sourceX,
        drawRectangle.sourceY,
        drawRectangle.sourceWidth,
        drawRectangle.sourceHeight,
        drawRectangle.targetX,
        drawRectangle.targetY,
        drawRectangle.targetWidth,
        drawRectangle.targetHeight
      );

      return {
        canvas,
        drawRectangle
      };
    }

    assertPixelLimit(width, height, options) {
      const pixels = width * height;

      if (
        Number.isFinite(options.maxSourcePixels) &&
        pixels > options.maxSourcePixels
      ) {
        throw new Error(
          `The source contains ${pixels.toLocaleString()} pixels, exceeding the configured limit.`
        );
      }
    }
  }

  /* =========================================================
     ENGINE
  ========================================================= */

  class ThumbnailGenerationEngine {
    constructor(options) {
      const config = options || {};

      this.defaultOptions = mergeOptions(
        DEFAULT_OPTIONS,
        config.defaultOptions
      );

      this.processor =
        config.processor ||
        new ThumbnailProcessor(config.processorOptions);

      this.cache =
        config.cache ||
        new ThumbnailCache({
          ttlMs:
            config.cacheTtlMs ||
            this.defaultOptions.cacheTtlMs,
          maxEntries:
            config.cacheMaxEntries ||
            this.defaultOptions.cacheMaxEntries
        });

      this.activeControllers = new Map();
      this.activeResults = new Map();
      this.disposed = false;
    }

    async generate(file, options) {
      if (this.disposed) {
        throw new Error(
          "The thumbnail generation engine has been disposed."
        );
      }

      if (!isFile(file) && !isBlob(file)) {
        throw new TypeError(
          "Thumbnail generation requires a File or Blob."
        );
      }

      const config = mergeOptions(
        this.defaultOptions,
        options
      );

      if (config.useCache) {
        const cached = this.cache.get(
          file,
          config
        );

        if (cached) {
          cached.fromCache = true;

          emit("media:thumbnail:cache-hit", {
            file,
            result: cached
          });

          return cached;
        }
      }

      const result = new ThumbnailResult(
        file,
        config
      );

      const controller = new AbortController();

      if (config.signal) {
        if (config.signal.aborted) {
          controller.abort(
            config.signal.reason ||
              createAbortError()
          );
        } else {
          config.signal.addEventListener(
            "abort",
            () => {
              controller.abort(
                config.signal.reason ||
                  createAbortError()
              );
            },
            {
              once: true
            }
          );
        }
      }

      this.activeControllers.set(
        result.id,
        controller
      );

      this.activeResults.set(
        result.id,
        result
      );

      result.start();

      syncStore(
        `mediaLibrary.thumbnails.active.${result.id}`,
        result.toJSON()
      );

      emit("media:thumbnail:start", {
        file,
        options: config,
        result
      });

      try {
        throwIfAborted(controller.signal);

        if (
          config.validateBeforeProcessing &&
          validationApi &&
          typeof validationApi.validate === "function"
        ) {
          const validation =
            await validationApi.validate(
              file,
              {
                signal: controller.signal,
                notify: false,
                useCache: true
              }
            );

          result.metadata.validation =
            typeof validation.toJSON === "function"
              ? validation.toJSON()
              : validation;

          if (
            config.rejectInvalidFiles &&
            validation &&
            validation.valid === false
          ) {
            const error = new Error(
              "The file failed validation and cannot be processed."
            );

            error.name =
              "ThumbnailValidationError";
            error.validation = validation;

            throw error;
          }
        }

        const processed =
          await this.processor.process(
            file,
            config,
            controller.signal
          );

        throwIfAborted(controller.signal);

        result.canvas = processed.canvas;
        result.metadata = {
          ...result.metadata,
          ...(processed.metadata || {}),
          generatedWidth: config.width,
          generatedHeight: config.height,
          format: config.format,
          quality: config.quality,
          fit: config.fit
        };

        await this.createOutput(
          result,
          processed.canvas,
          config
        );

        result.complete();

        if (config.useCache) {
          this.cache.set(
            file,
            config,
            result
          );
        }

        emit("media:thumbnail:ready", {
          file,
          result
        });

        syncStore(
          `mediaLibrary.thumbnails.results.${result.id}`,
          result.toJSON()
        );

        return result;
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error && error.name === "AbortError")
        ) {
          result.cancel();

          emit("media:thumbnail:cancelled", {
            file,
            result
          });

          return result;
        }

        result.fail(error);

        emit("media:thumbnail:failed", {
          file,
          result,
          error
        });

        if (config.notifyOnFailure) {
          notify(
            "error",
            `Thumbnail generation failed for ${
              file.name || "the selected file"
            }.`,
            {
              duration: 6000,
              metadata: {
                thumbnailId: result.id,
                error:
                  error && error.message
                    ? error.message
                    : String(error)
              }
            }
          );
        }

        return result;
      } finally {
        this.activeControllers.delete(
          result.id
        );

        this.activeResults.delete(
          result.id
        );

        syncStore(
          `mediaLibrary.thumbnails.active.${result.id}`,
          null
        );
      }
    }

    async createOutput(result, canvas, options) {
      if (options.output === THUMBNAIL_OUTPUT.CANVAS) {
        result.output = canvas;
        result.canvas = canvas;
        return;
      }

      if (options.output === THUMBNAIL_OUTPUT.BITMAP) {
        const bitmap =
          await createBitmapFromCanvas(canvas);

        result.bitmap = bitmap;
        result.output = bitmap;
        return;
      }

      const blob = await canvasToBlob(
        canvas,
        options.format,
        options.quality
      );

      result.blob = blob;

      if (options.output === THUMBNAIL_OUTPUT.BLOB) {
        result.output = blob;
        return;
      }

      if (
        options.output ===
        THUMBNAIL_OUTPUT.DATA_URL
      ) {
        const dataUrl = await blobToDataUrl(blob);

        result.dataUrl = dataUrl;
        result.output = dataUrl;
        return;
      }

      if (
        options.output ===
        THUMBNAIL_OUTPUT.OBJECT_URL
      ) {
        if (
          typeof URL === "undefined" ||
          typeof URL.createObjectURL !== "function"
        ) {
          throw new Error(
            "Object URL output is unavailable."
          );
        }

        const objectUrl =
          URL.createObjectURL(blob);

        result.objectUrl = objectUrl;
        result.output = objectUrl;
        return;
      }

      result.output = blob;
    }

    async generateBatch(files, options) {
      const config = mergeOptions(
        this.defaultOptions,
        options
      );

      const fileList = Array.from(
        files || []
      ).filter(
        (file) => isFile(file) || isBlob(file)
      );

      const concurrency = clamp(
        Number.isFinite(config.concurrency)
          ? config.concurrency
          : this.defaultOptions.concurrency,
        1,
        Math.max(1, fileList.length)
      );

      const batchId = createId(
        "thumbnail_batch"
      );

      const results = new Array(
        fileList.length
      );

      let nextIndex = 0;
      let completed = 0;
      let ready = 0;
      let failed = 0;
      let cancelled = 0;

      emit("media:thumbnail:batch:start", {
        batchId,
        total: fileList.length
      });

      const worker = async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;

          if (index >= fileList.length) {
            return;
          }

          throwIfAborted(config.signal);

          const file = fileList[index];

          const result = await this.generate(
            file,
            {
              ...config,
              notifyOnFailure: false
            }
          );

          results[index] = result;
          completed += 1;

          if (
            result.status ===
            THUMBNAIL_STATUS.READY
          ) {
            ready += 1;
          } else if (
            result.status ===
            THUMBNAIL_STATUS.CANCELLED
          ) {
            cancelled += 1;
          } else {
            failed += 1;
          }

          const progress = fileList.length
            ? completed / fileList.length
            : 1;

          const progressPayload = {
            batchId,
            total: fileList.length,
            completed,
            ready,
            failed,
            cancelled,
            progress,
            index,
            file,
            result
          };

          emit(
            "media:thumbnail:batch:progress",
            progressPayload
          );

          if (
            typeof config.onProgress === "function"
          ) {
            await config.onProgress(
              progressPayload
            );
          }
        }
      };

      try {
        await Promise.all(
          Array.from(
            {
              length: concurrency
            },
            () => worker()
          )
        );
      } catch (error) {
        emit(
          "media:thumbnail:batch:failed",
          {
            batchId,
            error,
            total: fileList.length,
            completed,
            ready,
            failed,
            cancelled
          }
        );

        throw error;
      }

      const summary = {
        batchId,
        total: fileList.length,
        completed,
        ready,
        failed,
        cancelled,
        results,
        successfulResults: results.filter(
          (result) =>
            result &&
            result.status ===
              THUMBNAIL_STATUS.READY
        ),
        failedResults: results.filter(
          (result) =>
            !result ||
            result.status ===
              THUMBNAIL_STATUS.FAILED
        ),
        cancelledResults: results.filter(
          (result) =>
            result &&
            result.status ===
              THUMBNAIL_STATUS.CANCELLED
        )
      };

      emit(
        "media:thumbnail:batch:complete",
        summary
      );

      syncStore(
        `mediaLibrary.thumbnails.batches.${batchId}`,
        {
          batchId,
          total: summary.total,
          completed: summary.completed,
          ready: summary.ready,
          failed: summary.failed,
          cancelled: summary.cancelled,
          results: results.map(
            (result) =>
              result
                ? result.toJSON()
                : null
          )
        }
      );

      return summary;
    }

    cancel(id, reason) {
      const controller =
        this.activeControllers.get(
          normalizeString(id)
        );

      if (!controller) {
        return false;
      }

      controller.abort(
        reason instanceof Error
          ? reason
          : createAbortError(
              normalizeString(reason) ||
                "Thumbnail generation cancelled."
            )
      );

      return true;
    }

    cancelAll(reason) {
      let count = 0;

      for (
        const controller of
        this.activeControllers.values()
      ) {
        if (!controller.signal.aborted) {
          controller.abort(
            reason instanceof Error
              ? reason
              : createAbortError(
                  normalizeString(reason) ||
                    "All thumbnail generation was cancelled."
                )
          );

          count += 1;
        }
      }

      return count;
    }

    clearCache() {
      this.cache.clear();
    }

    registerDocumentRenderer(
      id,
      matcher,
      renderer,
      options
    ) {
      return this.processor.documentRenderer.register(
        id,
        matcher,
        renderer,
        options
      );
    }

    unregisterDocumentRenderer(id) {
      return this.processor.documentRenderer.unregister(
        id
      );
    }

    getSnapshot() {
      return {
        initialized: true,
        disposed: this.disposed,
        active: this.activeControllers.size,
        cacheSize: this.cache.size,
        defaults: {
          ...this.defaultOptions
        }
      };
    }

    dispose() {
      this.cancelAll(
        "Thumbnail engine disposed."
      );

      this.cache.clear();
      this.activeControllers.clear();
      this.activeResults.clear();
      this.disposed = true;

      emit("media:thumbnail:disposed", {
        engine: this
      });
    }
  }

  /* =========================================================
     UPLOAD INTEGRATION
  ========================================================= */

  class ThumbnailUploadIntegration {
    constructor(engine) {
      this.engine = engine;
      this.enabled = true;
      this.bound = false;
      this.unsubscribe = [];
      this.generatedByUploadId = new Map();
    }

    bind() {
      if (this.bound) {
        return this;
      }

      this.bound = true;

      const queue =
        uploads.queue ||
        uploads.uploadQueue ||
        null;

      if (
        queue &&
        typeof queue.use === "function"
      ) {
        const middleware = async (
          context,
          next
        ) => {
          if (!this.enabled) {
            return next();
          }

          const file =
            context.file ||
            (context.item &&
              context.item.file);

          if (!isFile(file)) {
            return next();
          }

          const thumbnailOptions =
            context.thumbnailOptions ||
            (
              context.item &&
              context.item.thumbnailOptions
            ) ||
            {};

          const shouldGenerate =
            thumbnailOptions.enabled !== false &&
            context.generateThumbnail !== false;

          if (!shouldGenerate) {
            return next();
          }

          const result =
            await this.engine.generate(
              file,
              {
                ...thumbnailOptions,
                signal: context.signal,
                output:
                  thumbnailOptions.output ||
                  THUMBNAIL_OUTPUT.BLOB,
                notifyOnFailure: false
              }
            );

          context.thumbnail = result;

          if (context.item) {
            context.item.thumbnail = result;
          }

          const uploadId =
            context.uploadId ||
            (
              context.item &&
              (
                context.item.id ||
                context.item.uploadId
              )
            );

          if (uploadId) {
            this.generatedByUploadId.set(
              String(uploadId),
              result
            );
          }

          return next();
        };

        const unbind =
          queue.use(middleware);

        if (typeof unbind === "function") {
          this.unsubscribe.push(unbind);
        }
      }

      if (
        uploads.manager &&
        typeof uploads.manager.setThumbnailGenerator ===
          "function"
      ) {
        uploads.manager.setThumbnailGenerator(
          async (file, options) =>
            this.engine.generate(
              file,
              options
            )
        );
      }

      emit(
        "media:thumbnail:integration:bound",
        {
          integration: "upload-system"
        }
      );

      return this;
    }

    getByUploadId(uploadId) {
      return (
        this.generatedByUploadId.get(
          String(uploadId)
        ) || null
      );
    }

    releaseByUploadId(uploadId) {
      const key = String(uploadId);
      const result =
        this.generatedByUploadId.get(key);

      if (!result) {
        return false;
      }

      if (
        typeof result.dispose === "function"
      ) {
        result.dispose();
      }

      this.generatedByUploadId.delete(key);

      return true;
    }

    enable() {
      this.enabled = true;
      return this;
    }

    disable() {
      this.enabled = false;
      return this;
    }

    unbind() {
      while (
        this.unsubscribe.length > 0
      ) {
        const unsubscribe =
          this.unsubscribe.pop();

        try {
          unsubscribe();
        } catch (error) {
          console.error(
            "[AIFTMediaLibrary] Thumbnail integration cleanup failed.",
            error
          );
        }
      }

      for (
        const result of
        this.generatedByUploadId.values()
      ) {
        if (
          result &&
          typeof result.dispose === "function"
        ) {
          result.dispose();
        }
      }

      this.generatedByUploadId.clear();
      this.bound = false;

      emit(
        "media:thumbnail:integration:unbound",
        {
          integration: "upload-system"
        }
      );

      return this;
    }
  }

  /* =========================================================
     DOM PREVIEW BINDING
  ========================================================= */

  class ThumbnailPreviewBinder {
    constructor(engine) {
      this.engine = engine;
      this.bindings = new WeakMap();
    }

    async bind(element, file, options) {
      if (
        !element ||
        typeof element !== "object"
      ) {
        throw new TypeError(
          "A valid DOM element is required."
        );
      }

      this.unbind(element);

      const controller =
        new AbortController();

      const result =
        await this.engine.generate(
          file,
          {
            ...(options || {}),
            signal: controller.signal,
            output:
              THUMBNAIL_OUTPUT.OBJECT_URL
          }
        );

      if (
        result.status !==
        THUMBNAIL_STATUS.READY
      ) {
        return result;
      }

      const binding = {
        result,
        controller
      };

      this.bindings.set(
        element,
        binding
      );

      if (
        typeof HTMLImageElement !==
          "undefined" &&
        element instanceof HTMLImageElement
      ) {
        element.src = result.objectUrl;
      } else {
        element.style.backgroundImage =
          `url("${result.objectUrl}")`;
        element.style.backgroundSize =
          options && options.cssFit
            ? options.cssFit
            : "cover";
        element.style.backgroundPosition =
          options &&
          options.cssPosition
            ? options.cssPosition
            : "center";
        element.style.backgroundRepeat =
          "no-repeat";
      }

      element.dataset.aiftThumbnailId =
        result.id;

      return result;
    }

    unbind(element) {
      const binding =
        this.bindings.get(element);

      if (!binding) {
        return false;
      }

      binding.controller.abort(
        createAbortError(
          "Thumbnail preview binding removed."
        )
      );

      if (
        binding.result &&
        typeof binding.result.dispose ===
          "function"
      ) {
        binding.result.dispose();
      }

      if (
        typeof HTMLImageElement !==
          "undefined" &&
        element instanceof HTMLImageElement
      ) {
        element.removeAttribute("src");
      } else if (element.style) {
        element.style.backgroundImage = "";
      }

      if (element.dataset) {
        delete element.dataset.aiftThumbnailId;
      }

      this.bindings.delete(element);

      return true;
    }
  }

  /* =========================================================
     PUBLIC INITIALIZATION
  ========================================================= */

  const thumbnailEngine =
    new ThumbnailGenerationEngine();

  const uploadIntegration =
    new ThumbnailUploadIntegration(
      thumbnailEngine
    );

  const previewBinder =
    new ThumbnailPreviewBinder(
      thumbnailEngine
    );

  uploadIntegration.bind();

  const thumbnailApi = {
    constants: {
      status: THUMBNAIL_STATUS,
      source: THUMBNAIL_SOURCE,
      output: THUMBNAIL_OUTPUT,
      fit: THUMBNAIL_FIT,
      format: THUMBNAIL_FORMAT
    },

    engine: thumbnailEngine,
    cache: thumbnailEngine.cache,
    processor: thumbnailEngine.processor,
    uploadIntegration,
    previewBinder,

    generate(file, options) {
      return thumbnailEngine.generate(
        file,
        options
      );
    },

    generateBatch(files, options) {
      return thumbnailEngine.generateBatch(
        files,
        options
      );
    },

    cancel(id, reason) {
      return thumbnailEngine.cancel(
        id,
        reason
      );
    },

    cancelAll(reason) {
      return thumbnailEngine.cancelAll(
        reason
      );
    },

    clearCache() {
      return thumbnailEngine.clearCache();
    },

    bindPreview(element, file, options) {
      return previewBinder.bind(
        element,
        file,
        options
      );
    },

    unbindPreview(element) {
      return previewBinder.unbind(
        element
      );
    },

    registerDocumentRenderer(
      id,
      matcher,
      renderer,
      options
    ) {
      return thumbnailEngine.registerDocumentRenderer(
        id,
        matcher,
        renderer,
        options
      );
    },

    unregisterDocumentRenderer(id) {
      return thumbnailEngine.unregisterDocumentRenderer(
        id
      );
    },

    getSnapshot() {
      return thumbnailEngine.getSnapshot();
    },

    dispose() {
      uploadIntegration.unbind();
      thumbnailEngine.dispose();
    }
  };

  uploads.thumbnails = thumbnailApi;
  uploads.thumbnailEngine =
    thumbnailEngine;

  mediaLibrary.thumbnails =
    thumbnailApi;

  mediaLibrary.thumbnailGenerator =
    thumbnailApi;

  mediaLibrary.thumbnailGenerationEngine =
    thumbnailEngine;

  mediaLibrary.generateMediaThumbnail =
    function generateMediaThumbnail(
      file,
      options
    ) {
      return thumbnailEngine.generate(
        file,
        options
      );
    };

  mediaLibrary.generateMediaThumbnails =
    function generateMediaThumbnails(
      files,
      options
    ) {
      return thumbnailEngine.generateBatch(
        files,
        options
      );
    };

  mediaLibrary.bindMediaThumbnailPreview =
    function bindMediaThumbnailPreview(
      element,
      file,
      options
    ) {
      return previewBinder.bind(
        element,
        file,
        options
      );
    };

  mediaLibrary.unbindMediaThumbnailPreview =
    function unbindMediaThumbnailPreview(
      element
    ) {
      return previewBinder.unbind(
        element
      );
    };

  mediaLibrary.getMediaThumbnailSnapshot =
    function getMediaThumbnailSnapshot() {
      return thumbnailEngine.getSnapshot();
    };

  mediaLibrary.__thumbnailGenerationEngineInitialized =
    true;

  emit("media:thumbnail:initialized", {
    engine: thumbnailEngine,
    snapshot:
      thumbnailEngine.getSnapshot()
  });
})(window);
/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2G OF 15
   IMAGE OPTIMIZATION ENGINE
========================================================= */

(function initializeAIFTImageOptimizationEngine(global) {
  "use strict";

  const mediaLibrary = global.AIFTMediaLibrary;

  if (!mediaLibrary) {
    throw new Error(
      "AIFTMediaLibrary must be initialized before loading Part 2G."
    );
  }

  if (mediaLibrary.__imageOptimizationEngineInitialized) {
    return;
  }

  const uploads = mediaLibrary.uploads || (mediaLibrary.uploads = {});
  const eventBus = mediaLibrary.events || mediaLibrary.eventBus || null;
  const store = mediaLibrary.store || null;
  const notifications = mediaLibrary.notifications || null;

  const validationApi =
    mediaLibrary.validation ||
    mediaLibrary.fileValidation ||
    uploads.validation ||
    null;

  const thumbnailApi =
    mediaLibrary.thumbnails ||
    mediaLibrary.thumbnailGenerator ||
    uploads.thumbnails ||
    null;

  /* =========================================================
     CONSTANTS
  ========================================================= */

  const OPTIMIZATION_STATUS = Object.freeze({
    PENDING: "pending",
    QUEUED: "queued",
    DECODING: "decoding",
    ANALYZING: "analyzing",
    RESIZING: "resizing",
    ENCODING: "encoding",
    READY: "ready",
    SKIPPED: "skipped",
    FAILED: "failed",
    CANCELLED: "cancelled",
    UNSUPPORTED: "unsupported"
  });

  const OPTIMIZATION_STRATEGY = Object.freeze({
    LOSSLESS: "lossless",
    BALANCED: "balanced",
    AGGRESSIVE: "aggressive",
    CUSTOM: "custom"
  });

  const IMAGE_FORMAT = Object.freeze({
    ORIGINAL: "original",
    JPEG: "image/jpeg",
    PNG: "image/png",
    WEBP: "image/webp",
    AVIF: "image/avif"
  });

  const RESIZE_MODE = Object.freeze({
    NONE: "none",
    CONTAIN: "contain",
    COVER: "cover",
    STRETCH: "stretch",
    WIDTH: "width",
    HEIGHT: "height"
  });

  const OUTPUT_TYPE = Object.freeze({
    BLOB: "blob",
    FILE: "file",
    OBJECT_URL: "object-url",
    DATA_URL: "data-url",
    BITMAP: "bitmap",
    CANVAS: "canvas"
  });

  const TRANSPARENCY_MODE = Object.freeze({
    PRESERVE: "preserve",
    FLATTEN: "flatten",
    AUTO: "auto"
  });

  const ORIENTATION_MODE = Object.freeze({
    AUTO: "auto",
    NONE: "none"
  });

  const COLOR_SPACE = Object.freeze({
    SRGB: "srgb",
    DISPLAY_P3: "display-p3"
  });

  const DEFAULT_OPTIONS = Object.freeze({
    strategy: OPTIMIZATION_STRATEGY.BALANCED,
    format: IMAGE_FORMAT.ORIGINAL,
    output: OUTPUT_TYPE.FILE,

    resizeMode: RESIZE_MODE.CONTAIN,
    maxWidth: 2560,
    maxHeight: 2560,
    targetWidth: null,
    targetHeight: null,
    allowUpscale: false,

    quality: 0.84,
    minimumQuality: 0.5,
    qualityStep: 0.04,
    targetBytes: null,
    targetReductionRatio: null,
    maximumEncodeAttempts: 10,

    transparency: TRANSPARENCY_MODE.AUTO,
    background: "#ffffff",

    orientation: ORIENTATION_MODE.AUTO,
    colorSpace: COLOR_SPACE.SRGB,
    imageSmoothingQuality: "high",

    stripMetadata: true,
    preserveFilename: true,
    filenameSuffix: "-optimized",

    minimumSavingsBytes: 8 * 1024,
    minimumSavingsRatio: 0.03,
    skipWhenLarger: true,

    maximumSourcePixels: 120000000,
    maximumOutputPixels: 67108864,

    useWorkerWhenAvailable: false,
    concurrency: 2,

    validateBeforeProcessing: true,
    rejectInvalidFiles: true,

    generateThumbnail: false,
    thumbnailOptions: null,

    useCache: true,
    cacheTtlMs: 30 * 60 * 1000,
    cacheMaxEntries: 200,

    decodeTimeoutMs: 20000,
    notifyOnFailure: false,
    notifyOnSkip: false
  });

  const STRATEGY_PRESETS = Object.freeze({
    [OPTIMIZATION_STRATEGY.LOSSLESS]: {
      quality: 1,
      minimumQuality: 0.9,
      qualityStep: 0.02,
      resizeMode: RESIZE_MODE.CONTAIN,
      maxWidth: 4096,
      maxHeight: 4096,
      allowUpscale: false,
      minimumSavingsRatio: 0.01,
      minimumSavingsBytes: 1024,
      skipWhenLarger: true
    },

    [OPTIMIZATION_STRATEGY.BALANCED]: {
      quality: 0.84,
      minimumQuality: 0.58,
      qualityStep: 0.04,
      resizeMode: RESIZE_MODE.CONTAIN,
      maxWidth: 2560,
      maxHeight: 2560,
      allowUpscale: false,
      minimumSavingsRatio: 0.03,
      minimumSavingsBytes: 8 * 1024,
      skipWhenLarger: true
    },

    [OPTIMIZATION_STRATEGY.AGGRESSIVE]: {
      quality: 0.72,
      minimumQuality: 0.4,
      qualityStep: 0.05,
      resizeMode: RESIZE_MODE.CONTAIN,
      maxWidth: 1920,
      maxHeight: 1920,
      allowUpscale: false,
      minimumSavingsRatio: 0.01,
      minimumSavingsBytes: 1024,
      skipWhenLarger: false
    }
  });

  const SUPPORTED_EXTENSIONS = new Set([
    "jpg",
    "jpeg",
    "jpe",
    "png",
    "webp",
    "avif",
    "bmp",
    "gif",
    "tif",
    "tiff",
    "svg",
    "ico"
  ]);

  const FORMAT_EXTENSION_MAP = Object.freeze({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif"
  });

  const FORMAT_LABEL_MAP = Object.freeze({
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/avif": "AVIF"
  });

  /* =========================================================
     UTILITIES
  ========================================================= */

  function now() {
    return Date.now();
  }

  function createId(prefix) {
    const random =
      global.crypto &&
      typeof global.crypto.randomUUID === "function"
        ? global.crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    return `${prefix || "image_optimization"}_${random}`;
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeMime(value) {
    return normalizeString(value).toLowerCase().split(";")[0].trim();
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function isBlob(value) {
    return typeof Blob !== "undefined" && value instanceof Blob;
  }

  function isFile(value) {
    return typeof File !== "undefined" && value instanceof File;
  }

  function getExtension(filename) {
    const value = normalizeString(filename);
    const index = value.lastIndexOf(".");

    if (index <= 0 || index === value.length - 1) {
      return "";
    }

    return value.slice(index + 1).toLowerCase();
  }

  function getFilenameWithoutExtension(filename) {
    const value = normalizeString(filename);
    const index = value.lastIndexOf(".");

    if (index <= 0) {
      return value;
    }

    return value.slice(0, index);
  }

  function createAbortError(message) {
    try {
      return new DOMException(
        message || "Image optimization aborted.",
        "AbortError"
      );
    } catch (error) {
      const abortError = new Error(
        message || "Image optimization aborted."
      );

      abortError.name = "AbortError";
      return abortError;
    }
  }

  function throwIfAborted(signal) {
    if (signal && signal.aborted) {
      throw signal.reason || createAbortError();
    }
  }

  function emit(name, payload) {
    if (!eventBus) {
      return;
    }

    try {
      if (typeof eventBus.emit === "function") {
        eventBus.emit(name, payload);
      } else if (typeof eventBus.dispatch === "function") {
        eventBus.dispatch(name, payload);
      } else if (typeof eventBus.publish === "function") {
        eventBus.publish(name, payload);
      }
    } catch (error) {
      console.error(
        `[AIFTMediaLibrary] Event emission failed: ${name}`,
        error
      );
    }
  }

  function notify(type, message, options) {
    if (!notifications) {
      return;
    }

    try {
      if (typeof notifications[type] === "function") {
        notifications[type](message, options);
      } else if (typeof notifications.show === "function") {
        notifications.show({
          type,
          message,
          ...(options || {})
        });
      }
    } catch (error) {
      console.error(
        "[AIFTMediaLibrary] Image optimization notification failed.",
        error
      );
    }
  }

  function syncStore(path, value) {
    if (!store) {
      return;
    }

    try {
      if (typeof store.set === "function") {
        store.set(path, value);
      } else if (typeof store.update === "function") {
        store.update(path, value);
      } else if (typeof store.dispatch === "function") {
        store.dispatch({
          type: "MEDIA_IMAGE_OPTIMIZATION_UPDATE",
          payload: {
            path,
            value
          }
        });
      }
    } catch (error) {
      console.error(
        "[AIFTMediaLibrary] Image optimization store synchronization failed.",
        error
      );
    }
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    if (value < 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          reader.error ||
            new Error("Unable to convert optimized image to a data URL.")
        );
      };

      reader.onabort = () => {
        reject(createAbortError());
      };

      reader.readAsDataURL(blob);
    });
  }

  function createCanvas(width, height, colorSpace) {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height);
    }

    if (typeof document === "undefined") {
      throw new Error(
        "Canvas rendering is unavailable in this environment."
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    if (colorSpace) {
      canvas.dataset.aiftColorSpace = colorSpace;
    }

    return canvas;
  }

  function getCanvasContext(canvas, options) {
    const config = options || {};
    let context = null;

    try {
      context = canvas.getContext("2d", {
        alpha: true,
        colorSpace:
          config.colorSpace === COLOR_SPACE.DISPLAY_P3
            ? "display-p3"
            : "srgb",
        willReadFrequently: false
      });
    } catch (error) {
      context = canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false
      });
    }

    if (!context) {
      throw new Error("Unable to create a 2D canvas context.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality =
      config.imageSmoothingQuality || "high";

    return context;
  }

  function canvasToBlob(canvas, type, quality) {
    if (typeof canvas.convertToBlob === "function") {
      return canvas.convertToBlob({
        type,
        quality
      });
    }

    return new Promise((resolve, reject) => {
      if (typeof canvas.toBlob !== "function") {
        reject(
          new Error("Canvas blob export is unavailable.")
        );

        return;
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                `The browser could not encode the image as ${type}.`
              )
            );

            return;
          }

          resolve(blob);
        },
        type,
        quality
      );
    });
  }

  function waitForEvent(
    target,
    successEvent,
    failureEvents,
    timeoutMs,
    signal
  ) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer = null;

      const failures = Array.isArray(failureEvents)
        ? failureEvents
        : [failureEvents].filter(Boolean);

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        target.removeEventListener(successEvent, handleSuccess);

        for (const eventName of failures) {
          target.removeEventListener(eventName, handleFailure);
        }

        if (signal) {
          signal.removeEventListener("abort", handleAbort);
        }
      };

      const settle = (handler, value) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        handler(value);
      };

      const handleSuccess = (event) => {
        settle(resolve, event);
      };

      const handleFailure = () => {
        settle(
          reject,
          new Error(
            `Image decoding failed while waiting for "${successEvent}".`
          )
        );
      };

      const handleAbort = () => {
        settle(
          reject,
          signal.reason || createAbortError()
        );
      };

      target.addEventListener(successEvent, handleSuccess, {
        once: true
      });

      for (const eventName of failures) {
        target.addEventListener(eventName, handleFailure, {
          once: true
        });
      }

      if (signal) {
        if (signal.aborted) {
          handleAbort();
          return;
        }

        signal.addEventListener("abort", handleAbort, {
          once: true
        });
      }

      if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timer = setTimeout(() => {
          settle(
            reject,
            new Error(
              `Timed out while waiting for "${successEvent}".`
            )
          );
        }, timeoutMs);
      }
    });
  }

  function normalizeOptions(options) {
    const supplied = options || {};
    const requestedStrategy =
      supplied.strategy || DEFAULT_OPTIONS.strategy;

    const preset =
      STRATEGY_PRESETS[requestedStrategy] || {};

    const merged = {
      ...DEFAULT_OPTIONS,
      ...preset,
      ...supplied,
      strategy: requestedStrategy
    };

    merged.maxWidth = Number.isFinite(Number(merged.maxWidth))
      ? clamp(Math.round(Number(merged.maxWidth)), 1, 16384)
      : DEFAULT_OPTIONS.maxWidth;

    merged.maxHeight = Number.isFinite(Number(merged.maxHeight))
      ? clamp(Math.round(Number(merged.maxHeight)), 1, 16384)
      : DEFAULT_OPTIONS.maxHeight;

    merged.targetWidth = Number.isFinite(Number(merged.targetWidth))
      ? clamp(Math.round(Number(merged.targetWidth)), 1, 16384)
      : null;

    merged.targetHeight = Number.isFinite(Number(merged.targetHeight))
      ? clamp(Math.round(Number(merged.targetHeight)), 1, 16384)
      : null;

    merged.quality = clamp(
      Number.isFinite(Number(merged.quality))
        ? Number(merged.quality)
        : DEFAULT_OPTIONS.quality,
      0.01,
      1
    );

    merged.minimumQuality = clamp(
      Number.isFinite(Number(merged.minimumQuality))
        ? Number(merged.minimumQuality)
        : DEFAULT_OPTIONS.minimumQuality,
      0.01,
      merged.quality
    );

    merged.qualityStep = clamp(
      Number.isFinite(Number(merged.qualityStep))
        ? Number(merged.qualityStep)
        : DEFAULT_OPTIONS.qualityStep,
      0.01,
      0.25
    );

    merged.maximumEncodeAttempts = clamp(
      Number.isFinite(Number(merged.maximumEncodeAttempts))
        ? Math.round(Number(merged.maximumEncodeAttempts))
        : DEFAULT_OPTIONS.maximumEncodeAttempts,
      1,
      30
    );

    merged.minimumSavingsBytes = Math.max(
      0,
      Number(merged.minimumSavingsBytes) || 0
    );

    merged.minimumSavingsRatio = clamp(
      Number(merged.minimumSavingsRatio) || 0,
      0,
      1
    );

    merged.targetBytes =
      Number.isFinite(Number(merged.targetBytes)) &&
      Number(merged.targetBytes) > 0
        ? Math.round(Number(merged.targetBytes))
        : null;

    merged.targetReductionRatio =
      Number.isFinite(Number(merged.targetReductionRatio))
        ? clamp(Number(merged.targetReductionRatio), 0, 0.99)
        : null;

    merged.maximumSourcePixels = Math.max(
      1,
      Number(merged.maximumSourcePixels) ||
        DEFAULT_OPTIONS.maximumSourcePixels
    );

    merged.maximumOutputPixels = Math.max(
      1,
      Number(merged.maximumOutputPixels) ||
        DEFAULT_OPTIONS.maximumOutputPixels
    );

    if (!Object.values(RESIZE_MODE).includes(merged.resizeMode)) {
      merged.resizeMode = DEFAULT_OPTIONS.resizeMode;
    }

    if (!Object.values(OUTPUT_TYPE).includes(merged.output)) {
      merged.output = DEFAULT_OPTIONS.output;
    }

    if (!Object.values(TRANSPARENCY_MODE).includes(merged.transparency)) {
      merged.transparency = DEFAULT_OPTIONS.transparency;
    }

    if (!Object.values(ORIENTATION_MODE).includes(merged.orientation)) {
      merged.orientation = DEFAULT_OPTIONS.orientation;
    }

    return merged;
  }

  function isSupportedImage(file) {
    if (!file) {
      return false;
    }

    const mime = normalizeMime(file.type);
    const extension = getExtension(file.name);

    return (
      mime.startsWith("image/") ||
      SUPPORTED_EXTENSIONS.has(extension)
    );
  }

  function inferSourceFormat(file) {
    const mime = normalizeMime(file && file.type);

    if (
      mime === "image/jpeg" ||
      mime === "image/png" ||
      mime === "image/webp" ||
      mime === "image/avif"
    ) {
      return mime;
    }

    const extension = getExtension(file && file.name);

    if (["jpg", "jpeg", "jpe"].includes(extension)) {
      return "image/jpeg";
    }

    if (extension === "png") {
      return "image/png";
    }

    if (extension === "webp") {
      return "image/webp";
    }

    if (extension === "avif") {
      return "image/avif";
    }

    return "image/png";
  }

  function resolveOutputFormat(file, options, hasTransparency) {
    if (
      options.format &&
      options.format !== IMAGE_FORMAT.ORIGINAL
    ) {
      return options.format;
    }

    const sourceFormat = inferSourceFormat(file);

    if (
      sourceFormat === "image/jpeg" ||
      sourceFormat === "image/png" ||
      sourceFormat === "image/webp" ||
      sourceFormat === "image/avif"
    ) {
      return sourceFormat;
    }

    if (hasTransparency) {
      return "image/png";
    }

    return "image/jpeg";
  }

  function supportsTransparency(format) {
    return [
      "image/png",
      "image/webp",
      "image/avif"
    ].includes(format);
  }

  function buildOutputFilename(file, format, options) {
    const originalName =
      file && file.name
        ? file.name
        : "image";

    const baseName =
      getFilenameWithoutExtension(originalName) || "image";

    const sourceExtension = getExtension(originalName);
    const outputExtension =
      FORMAT_EXTENSION_MAP[format] ||
      sourceExtension ||
      "img";

    const suffix =
      normalizeString(options.filenameSuffix) ||
      "-optimized";

    if (
      options.preserveFilename &&
      sourceExtension === outputExtension
    ) {
      return `${baseName}${suffix}.${outputExtension}`;
    }

    return `${baseName}${suffix}.${outputExtension}`;
  }

  function calculateSavings(originalBytes, optimizedBytes) {
    const original = Number(originalBytes) || 0;
    const optimized = Number(optimizedBytes) || 0;
    const savedBytes = original - optimized;
    const ratio =
      original > 0
        ? savedBytes / original
        : 0;

    return {
      originalBytes: original,
      optimizedBytes: optimized,
      savedBytes,
      savingsRatio: ratio,
      savingsPercent: ratio * 100
    };
  }

  /* =========================================================
     RESULT MODEL
  ========================================================= */

  class ImageOptimizationResult {
    constructor(file, options) {
      this.id = createId("image_optimization");
      this.file = file;
      this.fileName = file ? file.name : "";
      this.sourceType = file ? normalizeMime(file.type) : "";
      this.sourceBytes = file ? file.size : 0;

      this.status = OPTIMIZATION_STATUS.PENDING;
      this.options = {
        ...options
      };

      this.sourceWidth = 0;
      this.sourceHeight = 0;
      this.outputWidth = 0;
      this.outputHeight = 0;

      this.outputFormat = null;
      this.outputQuality = null;
      this.outputBytes = 0;

      this.blob = null;
      this.outputFile = null;
      this.objectUrl = null;
      this.dataUrl = null;
      this.bitmap = null;
      this.canvas = null;
      this.output = null;

      this.metadata = {};
      this.validation = null;
      this.thumbnail = null;

      this.savings = {
        originalBytes: this.sourceBytes,
        optimizedBytes: 0,
        savedBytes: 0,
        savingsRatio: 0,
        savingsPercent: 0
      };

      this.error = null;
      this.skipReason = null;
      this.fromCache = false;

      this.createdAt = now();
      this.startedAt = null;
      this.completedAt = null;
      this.durationMs = 0;
    }

    setStatus(status) {
      this.status = status;
      return this;
    }

    start() {
      this.startedAt = now();
      return this;
    }

    complete() {
      this.status = OPTIMIZATION_STATUS.READY;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    skip(reason) {
      this.status = OPTIMIZATION_STATUS.SKIPPED;
      this.skipReason =
        normalizeString(reason) ||
        "Image optimization was not required.";
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    unsupported(reason) {
      this.status = OPTIMIZATION_STATUS.UNSUPPORTED;
      this.skipReason =
        normalizeString(reason) ||
        "This image format is unsupported.";
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    cancel() {
      this.status = OPTIMIZATION_STATUS.CANCELLED;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    fail(error) {
      this.status = OPTIMIZATION_STATUS.FAILED;
      this.error = {
        name:
          error && error.name
            ? error.name
            : "Error",
        message:
          error && error.message
            ? error.message
            : String(error || "Image optimization failed."),
        stack:
          error && error.stack
            ? error.stack
            : null
      };

      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    revokeObjectUrl() {
      if (
        this.objectUrl &&
        typeof URL !== "undefined" &&
        typeof URL.revokeObjectURL === "function"
      ) {
        URL.revokeObjectURL(this.objectUrl);
      }

      this.objectUrl = null;

      if (this.options.output === OUTPUT_TYPE.OBJECT_URL) {
        this.output = null;
      }
    }

    closeBitmap() {
      if (
        this.bitmap &&
        typeof this.bitmap.close === "function"
      ) {
        this.bitmap.close();
      }

      this.bitmap = null;

      if (this.options.output === OUTPUT_TYPE.BITMAP) {
        this.output = null;
      }
    }

    dispose() {
      this.revokeObjectUrl();
      this.closeBitmap();

      this.canvas = null;
      this.dataUrl = null;
      this.output = null;
      this.thumbnail = null;
    }

    toJSON() {
      return {
        id: this.id,
        fileName: this.fileName,
        sourceType: this.sourceType,
        sourceBytes: this.sourceBytes,
        status: this.status,

        sourceWidth: this.sourceWidth,
        sourceHeight: this.sourceHeight,
        outputWidth: this.outputWidth,
        outputHeight: this.outputHeight,

        outputFormat: this.outputFormat,
        outputQuality: this.outputQuality,
        outputBytes: this.outputBytes,

        objectUrl: this.objectUrl,
        dataUrl:
          this.options.output === OUTPUT_TYPE.DATA_URL
            ? this.dataUrl
            : null,

        metadata: this.metadata,
        savings: this.savings,
        error: this.error,
        skipReason: this.skipReason,
        fromCache: this.fromCache,

        createdAt: this.createdAt,
        startedAt: this.startedAt,
        completedAt: this.completedAt,
        durationMs: this.durationMs
      };
    }
  }

  /* =========================================================
     CACHE
  ========================================================= */

  class ImageOptimizationCache {
    constructor(options) {
      const config = options || {};

      this.ttlMs = Number.isFinite(config.ttlMs)
        ? Math.max(0, config.ttlMs)
        : DEFAULT_OPTIONS.cacheTtlMs;

      this.maxEntries = Number.isFinite(config.maxEntries)
        ? Math.max(1, config.maxEntries)
        : DEFAULT_OPTIONS.cacheMaxEntries;

      this.entries = new Map();
    }

    createKey(file, options) {
      return [
        normalizeString(file && file.name),
        Number(file && file.size) || 0,
        Number(file && file.lastModified) || 0,
        normalizeMime(file && file.type),

        options.strategy,
        options.format,
        options.output,

        options.resizeMode,
        options.maxWidth,
        options.maxHeight,
        options.targetWidth,
        options.targetHeight,
        options.allowUpscale,

        options.quality,
        options.minimumQuality,
        options.targetBytes,
        options.targetReductionRatio,

        options.transparency,
        options.background,
        options.orientation,
        options.colorSpace
      ].join("::");
    }

    get(file, options) {
      const key = this.createKey(file, options);
      const entry = this.entries.get(key);

      if (!entry) {
        return null;
      }

      if (
        this.ttlMs > 0 &&
        now() - entry.createdAt > this.ttlMs
      ) {
        this.deleteByKey(key);
        return null;
      }

      this.entries.delete(key);
      this.entries.set(key, entry);

      return entry.result;
    }

    set(file, options, result) {
      const key = this.createKey(file, options);

      if (this.entries.has(key)) {
        this.deleteByKey(key);
      }

      this.entries.set(key, {
        createdAt: now(),
        result
      });

      while (this.entries.size > this.maxEntries) {
        const oldestKey =
          this.entries.keys().next().value;

        this.deleteByKey(oldestKey);
      }

      return result;
    }

    delete(file, options) {
      return this.deleteByKey(
        this.createKey(file, options)
      );
    }

    deleteByKey(key) {
      const entry = this.entries.get(key);

      if (!entry) {
        return false;
      }

      if (
        entry.result &&
        typeof entry.result.dispose === "function"
      ) {
        entry.result.dispose();
      }

      return this.entries.delete(key);
    }

    clear() {
      for (const key of this.entries.keys()) {
        this.deleteByKey(key);
      }
    }

    prune() {
      if (this.ttlMs <= 0) {
        return 0;
      }

      let removed = 0;
      const timestamp = now();

      for (const [key, entry] of this.entries.entries()) {
        if (timestamp - entry.createdAt > this.ttlMs) {
          this.deleteByKey(key);
          removed += 1;
        }
      }

      return removed;
    }

    get size() {
      return this.entries.size;
    }
  }

  /* =========================================================
     IMAGE DECODER
  ========================================================= */

  class OptimizationImageDecoder {
    async decode(file, options) {
      const config = options || {};
      const signal = config.signal;

      throwIfAborted(signal);

      if (typeof createImageBitmap === "function") {
        try {
          const bitmapOptions = {};

          if (config.orientation === ORIENTATION_MODE.AUTO) {
            bitmapOptions.imageOrientation = "from-image";
          }

          bitmapOptions.premultiplyAlpha = "default";
          bitmapOptions.colorSpaceConversion = "default";

          const bitmap = await createImageBitmap(
            file,
            bitmapOptions
          );

          throwIfAborted(signal);

          return {
            source: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            decoder: "createImageBitmap",
            dispose() {
              if (typeof bitmap.close === "function") {
                bitmap.close();
              }
            }
          };
        } catch (error) {
          if (error && error.name === "AbortError") {
            throw error;
          }
        }
      }

      if (
        typeof document === "undefined" ||
        typeof URL === "undefined"
      ) {
        throw new Error(
          "Image decoding is unavailable in this environment."
        );
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.decoding = "async";

      try {
        const loaded = waitForEvent(
          image,
          "load",
          "error",
          config.decodeTimeoutMs,
          signal
        );

        image.src = objectUrl;

        await loaded;

        throwIfAborted(signal);

        const width =
          image.naturalWidth ||
          image.width ||
          0;

        const height =
          image.naturalHeight ||
          image.height ||
          0;

        if (width <= 0 || height <= 0) {
          throw new Error(
            "The source image reported invalid dimensions."
          );
        }

        return {
          source: image,
          width,
          height,
          decoder: "image-element",
          dispose() {
            image.removeAttribute("src");
            URL.revokeObjectURL(objectUrl);
          }
        };
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
      }
    }
  }

  /* =========================================================
     IMAGE ANALYZER
  ========================================================= */

  class ImageAnalyzer {
    analyze(source, width, height, options) {
      const sampleSize = Math.min(128, width, height);
      const sampleCanvas = createCanvas(
        sampleSize,
        sampleSize
      );

      const context = getCanvasContext(
        sampleCanvas,
        options
      );

      context.clearRect(
        0,
        0,
        sampleSize,
        sampleSize
      );

      context.drawImage(
        source,
        0,
        0,
        width,
        height,
        0,
        0,
        sampleSize,
        sampleSize
      );

      let imageData;

      try {
        imageData = context.getImageData(
          0,
          0,
          sampleSize,
          sampleSize
        );
      } catch (error) {
        return {
          hasTransparency: false,
          opacityRatio: 1,
          averageLuminance: null,
          averageSaturation: null,
          complexityScore: null,
          analysisAvailable: false
        };
      }

      const pixels = imageData.data;
      const pixelCount = sampleSize * sampleSize;

      let transparentPixels = 0;
      let luminanceTotal = 0;
      let saturationTotal = 0;
      let variationTotal = 0;
      let previousLuminance = null;

      for (
        let index = 0;
        index < pixels.length;
        index += 4
      ) {
        const red = pixels[index] / 255;
        const green = pixels[index + 1] / 255;
        const blue = pixels[index + 2] / 255;
        const alpha = pixels[index + 3] / 255;

        if (alpha < 0.999) {
          transparentPixels += 1;
        }

        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const luminance =
          0.2126 * red +
          0.7152 * green +
          0.0722 * blue;

        const saturation =
          maximum === 0
            ? 0
            : (maximum - minimum) / maximum;

        luminanceTotal += luminance;
        saturationTotal += saturation;

        if (previousLuminance !== null) {
          variationTotal += Math.abs(
            luminance - previousLuminance
          );
        }

        previousLuminance = luminance;
      }

      const opacityRatio =
        1 - transparentPixels / pixelCount;

      const averageLuminance =
        luminanceTotal / pixelCount;

      const averageSaturation =
        saturationTotal / pixelCount;

      const complexityScore = clamp(
        variationTotal /
          Math.max(1, pixelCount - 1) *
          4,
        0,
        1
      );

      return {
        hasTransparency: transparentPixels > 0,
        opacityRatio,
        averageLuminance,
        averageSaturation,
        complexityScore,
        analysisAvailable: true
      };
    }
  }

  /* =========================================================
     RESIZE CALCULATOR
  ========================================================= */

  class ImageResizeCalculator {
    calculate(sourceWidth, sourceHeight, options) {
      const sourceRatio =
        sourceWidth / sourceHeight;

      let outputWidth = sourceWidth;
      let outputHeight = sourceHeight;
      let crop = null;

      if (options.resizeMode === RESIZE_MODE.NONE) {
        return this.finalize(
          sourceWidth,
          sourceHeight,
          outputWidth,
          outputHeight,
          crop,
          options
        );
      }

      if (
        options.resizeMode === RESIZE_MODE.WIDTH &&
        options.targetWidth
      ) {
        outputWidth = options.targetWidth;
        outputHeight = Math.round(
          outputWidth / sourceRatio
        );
      } else if (
        options.resizeMode === RESIZE_MODE.HEIGHT &&
        options.targetHeight
      ) {
        outputHeight = options.targetHeight;
        outputWidth = Math.round(
          outputHeight * sourceRatio
        );
      } else if (
        options.resizeMode === RESIZE_MODE.STRETCH &&
        options.targetWidth &&
        options.targetHeight
      ) {
        outputWidth = options.targetWidth;
        outputHeight = options.targetHeight;
      } else if (
        options.resizeMode === RESIZE_MODE.COVER &&
        options.targetWidth &&
        options.targetHeight
      ) {
        outputWidth = options.targetWidth;
        outputHeight = options.targetHeight;

        const targetRatio =
          outputWidth / outputHeight;

        if (sourceRatio > targetRatio) {
          const cropWidth =
            sourceHeight * targetRatio;

          crop = {
            sourceX:
              (sourceWidth - cropWidth) / 2,
            sourceY: 0,
            sourceWidth: cropWidth,
            sourceHeight
          };
        } else {
          const cropHeight =
            sourceWidth / targetRatio;

          crop = {
            sourceX: 0,
            sourceY:
              (sourceHeight - cropHeight) / 2,
            sourceWidth,
            sourceHeight: cropHeight
          };
        }
      } else {
        const maxWidth =
          options.targetWidth ||
          options.maxWidth ||
          sourceWidth;

        const maxHeight =
          options.targetHeight ||
          options.maxHeight ||
          sourceHeight;

        const scale = Math.min(
          maxWidth / sourceWidth,
          maxHeight / sourceHeight
        );

        const effectiveScale =
          options.allowUpscale
            ? scale
            : Math.min(scale, 1);

        outputWidth = Math.max(
          1,
          Math.round(sourceWidth * effectiveScale)
        );

        outputHeight = Math.max(
          1,
          Math.round(sourceHeight * effectiveScale)
        );
      }

      return this.finalize(
        sourceWidth,
        sourceHeight,
        outputWidth,
        outputHeight,
        crop,
        options
      );
    }

    finalize(
      sourceWidth,
      sourceHeight,
      outputWidth,
      outputHeight,
      crop,
      options
    ) {
      if (!options.allowUpscale) {
        if (
          outputWidth > sourceWidth ||
          outputHeight > sourceHeight
        ) {
          const ratio = Math.min(
            sourceWidth / outputWidth,
            sourceHeight / outputHeight
          );

          outputWidth = Math.max(
            1,
            Math.round(outputWidth * ratio)
          );

          outputHeight = Math.max(
            1,
            Math.round(outputHeight * ratio)
          );
        }
      }

      const outputPixels =
        outputWidth * outputHeight;

      if (
        outputPixels >
        options.maximumOutputPixels
      ) {
        const reduction = Math.sqrt(
          options.maximumOutputPixels /
            outputPixels
        );

        outputWidth = Math.max(
          1,
          Math.floor(outputWidth * reduction)
        );

        outputHeight = Math.max(
          1,
          Math.floor(outputHeight * reduction)
        );
      }

      return {
        sourceWidth,
        sourceHeight,
        outputWidth,
        outputHeight,
        crop
      };
    }
  }

  /* =========================================================
     CANVAS RENDERER
  ========================================================= */

  class ImageCanvasRenderer {
    render(decoded, resize, analysis, format, options) {
      const canvas = createCanvas(
        resize.outputWidth,
        resize.outputHeight,
        options.colorSpace
      );

      const context = getCanvasContext(
        canvas,
        options
      );

      const shouldFlatten =
        options.transparency ===
          TRANSPARENCY_MODE.FLATTEN ||
        !supportsTransparency(format) ||
        (
          options.transparency ===
            TRANSPARENCY_MODE.AUTO &&
          !analysis.hasTransparency
        );

      if (shouldFlatten) {
        context.fillStyle =
          normalizeString(options.background) ||
          "#ffffff";

        context.fillRect(
          0,
          0,
          resize.outputWidth,
          resize.outputHeight
        );
      } else {
        context.clearRect(
          0,
          0,
          resize.outputWidth,
          resize.outputHeight
        );
      }

      const crop = resize.crop || {
        sourceX: 0,
        sourceY: 0,
        sourceWidth: decoded.width,
        sourceHeight: decoded.height
      };

      context.drawImage(
        decoded.source,
        crop.sourceX,
        crop.sourceY,
        crop.sourceWidth,
        crop.sourceHeight,
        0,
        0,
        resize.outputWidth,
        resize.outputHeight
      );

      return {
        canvas,
        flattened: shouldFlatten
      };
    }
  }

  /* =========================================================
     ADAPTIVE ENCODER
  ========================================================= */

  class AdaptiveImageEncoder {
    async encode(canvas, sourceFile, format, options, signal) {
      throwIfAborted(signal);

      const targetBytes =
        this.resolveTargetBytes(
          sourceFile,
          options
        );

      const isQualityFormat = [
        "image/jpeg",
        "image/webp",
        "image/avif"
      ].includes(format);

      if (!isQualityFormat) {
        const blob = await canvasToBlob(
          canvas,
          format,
          options.quality
        );

        return {
          blob,
          quality: null,
          attempts: 1,
          targetBytes,
          targetReached:
            targetBytes === null ||
            blob.size <= targetBytes
        };
      }

      if (!targetBytes) {
        const blob = await canvasToBlob(
          canvas,
          format,
          options.quality
        );

        return {
          blob,
          quality: options.quality,
          attempts: 1,
          targetBytes: null,
          targetReached: true
        };
      }

      let quality = options.quality;
      let bestBlob = null;
      let bestQuality = quality;
      let attempts = 0;

      while (
        attempts <
        options.maximumEncodeAttempts
      ) {
        throwIfAborted(signal);

        const blob = await canvasToBlob(
          canvas,
          format,
          quality
        );

        attempts += 1;

        if (
          !bestBlob ||
          Math.abs(blob.size - targetBytes) <
            Math.abs(bestBlob.size - targetBytes)
        ) {
          bestBlob = blob;
          bestQuality = quality;
        }

        if (blob.size <= targetBytes) {
          return {
            blob,
            quality,
            attempts,
            targetBytes,
            targetReached: true
          };
        }

        const nextQuality =
          quality - options.qualityStep;

        if (
          nextQuality <
          options.minimumQuality
        ) {
          break;
        }

        quality = Math.max(
          options.minimumQuality,
          nextQuality
        );
      }

      return {
        blob: bestBlob,
        quality: bestQuality,
        attempts,
        targetBytes,
        targetReached:
          bestBlob
            ? bestBlob.size <= targetBytes
            : false
      };
    }

    resolveTargetBytes(file, options) {
      if (options.targetBytes) {
        return options.targetBytes;
      }

      if (
        options.targetReductionRatio !== null
      ) {
        return Math.max(
          1,
          Math.round(
            file.size *
              (1 - options.targetReductionRatio)
          )
        );
      }

      return null;
    }
  }

  /* =========================================================
     PROCESSOR
  ========================================================= */

  class ImageOptimizationProcessor {
    constructor(options) {
      const config = options || {};

      this.decoder =
        config.decoder ||
        new OptimizationImageDecoder();

      this.analyzer =
        config.analyzer ||
        new ImageAnalyzer();

      this.resizeCalculator =
        config.resizeCalculator ||
        new ImageResizeCalculator();

      this.renderer =
        config.renderer ||
        new ImageCanvasRenderer();

      this.encoder =
        config.encoder ||
        new AdaptiveImageEncoder();
    }

    async process(file, options, signal, result) {
      result.setStatus(
        OPTIMIZATION_STATUS.DECODING
      );

      emit("media:image-optimization:stage", {
        id: result.id,
        file,
        stage: OPTIMIZATION_STATUS.DECODING
      });

      const decoded = await this.decoder.decode(
        file,
        {
          signal,
          orientation: options.orientation,
          decodeTimeoutMs: options.decodeTimeoutMs
        }
      );

      try {
        throwIfAborted(signal);

        const sourcePixels =
          decoded.width * decoded.height;

        if (
          sourcePixels >
          options.maximumSourcePixels
        ) {
          throw new Error(
            `The source image contains ${sourcePixels.toLocaleString()} pixels, exceeding the configured maximum.`
          );
        }

        result.sourceWidth = decoded.width;
        result.sourceHeight = decoded.height;

        result.setStatus(
          OPTIMIZATION_STATUS.ANALYZING
        );

        emit("media:image-optimization:stage", {
          id: result.id,
          file,
          stage: OPTIMIZATION_STATUS.ANALYZING
        });

        const analysis =
          this.analyzer.analyze(
            decoded.source,
            decoded.width,
            decoded.height,
            options
          );

        const format =
          resolveOutputFormat(
            file,
            options,
            analysis.hasTransparency
          );

        const resize =
          this.resizeCalculator.calculate(
            decoded.width,
            decoded.height,
            options
          );

        result.outputWidth =
          resize.outputWidth;

        result.outputHeight =
          resize.outputHeight;

        result.outputFormat = format;

        result.metadata.analysis = analysis;
        result.metadata.decoder =
          decoded.decoder;

        result.metadata.resize = {
          sourceWidth: resize.sourceWidth,
          sourceHeight: resize.sourceHeight,
          outputWidth: resize.outputWidth,
          outputHeight: resize.outputHeight,
          crop: resize.crop
        };

        result.setStatus(
          OPTIMIZATION_STATUS.RESIZING
        );

        emit("media:image-optimization:stage", {
          id: result.id,
          file,
          stage: OPTIMIZATION_STATUS.RESIZING
        });

        const rendered =
          this.renderer.render(
            decoded,
            resize,
            analysis,
            format,
            options
          );

        result.canvas = rendered.canvas;
        result.metadata.flattened =
          rendered.flattened;

        result.setStatus(
          OPTIMIZATION_STATUS.ENCODING
        );

        emit("media:image-optimization:stage", {
          id: result.id,
          file,
          stage: OPTIMIZATION_STATUS.ENCODING
        });

        const encoded =
          await this.encoder.encode(
            rendered.canvas,
            file,
            format,
            options,
            signal
          );

        result.blob = encoded.blob;
        result.outputBytes =
          encoded.blob.size;

        result.outputQuality =
          encoded.quality;

        result.metadata.encoding = {
          format,
          quality: encoded.quality,
          attempts: encoded.attempts,
          targetBytes: encoded.targetBytes,
          targetReached:
            encoded.targetReached
        };

        result.savings =
          calculateSavings(
            file.size,
            encoded.blob.size
          );

        return {
          blob: encoded.blob,
          canvas: rendered.canvas,
          format,
          quality: encoded.quality,
          analysis,
          resize,
          encoding: encoded
        };
      } finally {
        decoded.dispose();
      }
    }
  }

  /* =========================================================
     ENGINE
  ========================================================= */

  class ImageOptimizationEngine {
    constructor(options) {
      const config = options || {};

      this.defaultOptions =
        normalizeOptions(
          config.defaultOptions
        );

      this.processor =
        config.processor ||
        new ImageOptimizationProcessor(
          config.processorOptions
        );

      this.cache =
        config.cache ||
        new ImageOptimizationCache({
          ttlMs:
            config.cacheTtlMs ||
            this.defaultOptions.cacheTtlMs,
          maxEntries:
            config.cacheMaxEntries ||
            this.defaultOptions.cacheMaxEntries
        });

      this.activeControllers = new Map();
      this.activeResults = new Map();
      this.disposed = false;
    }

    async optimize(file, options) {
      if (this.disposed) {
        throw new Error(
          "The image optimization engine has been disposed."
        );
      }

      if (!isFile(file) && !isBlob(file)) {
        throw new TypeError(
          "Image optimization requires a File or Blob."
        );
      }

      const config =
        normalizeOptions({
          ...this.defaultOptions,
          ...(options || {})
        });

      if (!isSupportedImage(file)) {
        const unsupportedResult =
          new ImageOptimizationResult(
            file,
            config
          );

        unsupportedResult
          .start()
          .unsupported(
            "The selected file is not a supported image."
          );

        emit(
          "media:image-optimization:unsupported",
          {
            file,
            result: unsupportedResult
          }
        );

        return unsupportedResult;
      }

      if (config.useCache) {
        const cached = this.cache.get(
          file,
          config
        );

        if (cached) {
          cached.fromCache = true;

          emit(
            "media:image-optimization:cache-hit",
            {
              file,
              result: cached
            }
          );

          return cached;
        }
      }

      const result =
        new ImageOptimizationResult(
          file,
          config
        );

      const controller =
        new AbortController();

      if (config.signal) {
        if (config.signal.aborted) {
          controller.abort(
            config.signal.reason ||
              createAbortError()
          );
        } else {
          config.signal.addEventListener(
            "abort",
            () => {
              controller.abort(
                config.signal.reason ||
                  createAbortError()
              );
            },
            {
              once: true
            }
          );
        }
      }

      this.activeControllers.set(
        result.id,
        controller
      );

      this.activeResults.set(
        result.id,
        result
      );

      result.start();

      syncStore(
        `mediaLibrary.imageOptimization.active.${result.id}`,
        result.toJSON()
      );

      emit(
        "media:image-optimization:start",
        {
          file,
          options: config,
          result
        }
      );

      try {
        throwIfAborted(controller.signal);

        if (
          config.validateBeforeProcessing &&
          validationApi &&
          typeof validationApi.validate ===
            "function"
        ) {
          const validation =
            await validationApi.validate(
              file,
              {
                signal: controller.signal,
                notify: false,
                useCache: true
              }
            );

          result.validation = validation;

          result.metadata.validation =
            typeof validation.toJSON ===
            "function"
              ? validation.toJSON()
              : validation;

          if (
            config.rejectInvalidFiles &&
            validation &&
            validation.valid === false
          ) {
            const error = new Error(
              "The image failed validation and cannot be optimized."
            );

            error.name =
              "ImageOptimizationValidationError";

            error.validation =
              validation;

            throw error;
          }
        }

        const processed =
          await this.processor.process(
            file,
            config,
            controller.signal,
            result
          );

        throwIfAborted(controller.signal);

        const shouldSkip =
          this.shouldSkipResult(
            file,
            processed.blob,
            config
          );

        if (shouldSkip.skip) {
          this.assignOriginalOutput(
            result,
            file,
            config
          );

          result.skip(
            shouldSkip.reason
          );

          emit(
            "media:image-optimization:skipped",
            {
              file,
              result,
              reason:
                shouldSkip.reason
            }
          );

          if (config.notifyOnSkip) {
            notify(
              "info",
              `${file.name || "The image"} was already efficiently optimized.`,
              {
                duration: 4000
              }
            );
          }

          return result;
        }

        await this.createOutput(
          result,
          processed.blob,
          processed.canvas,
          file,
          config
        );

        if (
          config.generateThumbnail &&
          thumbnailApi &&
          typeof thumbnailApi.generate ===
            "function"
        ) {
          const thumbnailSource =
            result.outputFile ||
            new File(
              [processed.blob],
              buildOutputFilename(
                file,
                processed.format,
                config
              ),
              {
                type: processed.format,
                lastModified: now()
              }
            );

          result.thumbnail =
            await thumbnailApi.generate(
              thumbnailSource,
              {
                ...(config.thumbnailOptions ||
                  {}),
                signal:
                  controller.signal,
                notifyOnFailure: false
              }
            );
        }

        result.complete();

        if (config.useCache) {
          this.cache.set(
            file,
            config,
            result
          );
        }

        emit(
          "media:image-optimization:ready",
          {
            file,
            result
          }
        );

        syncStore(
          `mediaLibrary.imageOptimization.results.${result.id}`,
          result.toJSON()
        );

        return result;
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error &&
            error.name === "AbortError")
        ) {
          result.cancel();

          emit(
            "media:image-optimization:cancelled",
            {
              file,
              result
            }
          );

          return result;
        }

        result.fail(error);

        emit(
          "media:image-optimization:failed",
          {
            file,
            result,
            error
          }
        );

        if (config.notifyOnFailure) {
          notify(
            "error",
            `Image optimization failed for ${
              file.name || "the selected image"
            }.`,
            {
              duration: 6000,
              metadata: {
                optimizationId:
                  result.id,
                error:
                  error &&
                  error.message
                    ? error.message
                    : String(error)
              }
            }
          );
        }

        return result;
      } finally {
        this.activeControllers.delete(
          result.id
        );

        this.activeResults.delete(
          result.id
        );

        syncStore(
          `mediaLibrary.imageOptimization.active.${result.id}`,
          null
        );

        syncStore(
          `mediaLibrary.imageOptimization.results.${result.id}`,
          result.toJSON()
        );
      }
    }

    shouldSkipResult(file, blob, options) {
      if (!options.skipWhenLarger) {
        return {
          skip: false,
          reason: null
        };
      }

      const savings =
        calculateSavings(
          file.size,
          blob.size
        );

      if (blob.size >= file.size) {
        return {
          skip: true,
          reason:
            "The optimized image would be the same size or larger than the original."
        };
      }

      if (
        savings.savedBytes <
        options.minimumSavingsBytes
      ) {
        return {
          skip: true,
          reason:
            `The optimization would save only ${formatBytes(
              savings.savedBytes
            )}, below the configured minimum.`
        };
      }

      if (
        savings.savingsRatio <
        options.minimumSavingsRatio
      ) {
        return {
          skip: true,
          reason:
            "The optimization savings ratio is below the configured minimum."
        };
      }

      return {
        skip: false,
        reason: null
      };
    }

    assignOriginalOutput(
      result,
      file,
      options
    ) {
      result.outputBytes = file.size;
      result.outputFormat =
        inferSourceFormat(file);

      result.savings =
        calculateSavings(
          file.size,
          file.size
        );

      if (
        options.output ===
        OUTPUT_TYPE.FILE
      ) {
        result.outputFile = file;
        result.output = file;
        return;
      }

      if (
        options.output ===
        OUTPUT_TYPE.BLOB
      ) {
        result.blob = file;
        result.output = file;
        return;
      }

      result.output = file;
    }

    async createOutput(
      result,
      blob,
      canvas,
      sourceFile,
      options
    ) {
      result.blob = blob;
      result.canvas = canvas;
      result.outputBytes =
        blob.size;

      if (
        options.output ===
        OUTPUT_TYPE.BLOB
      ) {
        result.output = blob;
        return;
      }

      if (
        options.output ===
        OUTPUT_TYPE.FILE
      ) {
        const filename =
          buildOutputFilename(
            sourceFile,
            result.outputFormat,
            options
          );

        const outputFile =
          new File(
            [blob],
            filename,
            {
              type:
                result.outputFormat,
              lastModified: now()
            }
          );

        result.outputFile =
          outputFile;

        result.output =
          outputFile;

        return;
      }

      if (
        options.output ===
        OUTPUT_TYPE.OBJECT_URL
      ) {
        if (
          typeof URL === "undefined" ||
          typeof URL.createObjectURL !==
            "function"
        ) {
          throw new Error(
            "Object URL output is unavailable."
          );
        }

        result.objectUrl =
          URL.createObjectURL(blob);

        result.output =
          result.objectUrl;

        return;
      }

      if (
        options.output ===
        OUTPUT_TYPE.DATA_URL
      ) {
        result.dataUrl =
          await blobToDataUrl(blob);

        result.output =
          result.dataUrl;

        return;
      }

      if (
        options.output ===
        OUTPUT_TYPE.CANVAS
      ) {
        result.output = canvas;
        return;
      }

      if (
        options.output ===
        OUTPUT_TYPE.BITMAP
      ) {
        if (
          typeof createImageBitmap !==
          "function"
        ) {
          throw new Error(
            "ImageBitmap output is unavailable."
          );
        }

        result.bitmap =
          await createImageBitmap(blob);

        result.output =
          result.bitmap;

        return;
      }

      result.output = blob;
    }

    async optimizeBatch(files, options) {
      const config =
        normalizeOptions({
          ...this.defaultOptions,
          ...(options || {})
        });

      const fileList = Array.from(
        files || []
      ).filter(
        (file) =>
          isFile(file) ||
          isBlob(file)
      );

      const concurrency = clamp(
        Number.isFinite(
          Number(config.concurrency)
        )
          ? Math.round(
              Number(config.concurrency)
            )
          : DEFAULT_OPTIONS.concurrency,
        1,
        Math.max(1, fileList.length)
      );

      const batchId =
        createId(
          "image_optimization_batch"
        );

      const results =
        new Array(fileList.length);

      let nextIndex = 0;
      let completed = 0;
      let optimized = 0;
      let skipped = 0;
      let failed = 0;
      let cancelled = 0;
      let originalBytes = 0;
      let outputBytes = 0;

      for (const file of fileList) {
        originalBytes +=
          Number(file.size) || 0;
      }

      emit(
        "media:image-optimization:batch:start",
        {
          batchId,
          total: fileList.length,
          originalBytes
        }
      );

      const worker = async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;

          if (index >= fileList.length) {
            return;
          }

          throwIfAborted(config.signal);

          const file =
            fileList[index];

          const result =
            await this.optimize(
              file,
              {
                ...config,
                notifyOnFailure: false,
                notifyOnSkip: false
              }
            );

          results[index] = result;
          completed += 1;

          if (
            result.status ===
            OPTIMIZATION_STATUS.READY
          ) {
            optimized += 1;
          } else if (
            result.status ===
            OPTIMIZATION_STATUS.SKIPPED
          ) {
            skipped += 1;
          } else if (
            result.status ===
            OPTIMIZATION_STATUS.CANCELLED
          ) {
            cancelled += 1;
          } else {
            failed += 1;
          }

          outputBytes +=
            result.outputBytes ||
            file.size ||
            0;

          const progress =
            fileList.length
              ? completed /
                fileList.length
              : 1;

          const progressPayload = {
            batchId,
            total:
              fileList.length,
            completed,
            optimized,
            skipped,
            failed,
            cancelled,
            originalBytes,
            outputBytes,
            savedBytes:
              originalBytes -
              outputBytes,
            progress,
            index,
            file,
            result
          };

          emit(
            "media:image-optimization:batch:progress",
            progressPayload
          );

          if (
            typeof config.onProgress ===
            "function"
          ) {
            await config.onProgress(
              progressPayload
            );
          }
        }
      };

      try {
        await Promise.all(
          Array.from(
            {
              length: concurrency
            },
            () => worker()
          )
        );
      } catch (error) {
        emit(
          "media:image-optimization:batch:failed",
          {
            batchId,
            error,
            total:
              fileList.length,
            completed,
            optimized,
            skipped,
            failed,
            cancelled
          }
        );

        throw error;
      }

      const savings =
        calculateSavings(
          originalBytes,
          outputBytes
        );

      const summary = {
        batchId,
        total: fileList.length,
        completed,
        optimized,
        skipped,
        failed,
        cancelled,
        originalBytes,
        outputBytes,
        savings,
        results,

        optimizedResults:
          results.filter(
            (result) =>
              result &&
              result.status ===
                OPTIMIZATION_STATUS.READY
          ),

        skippedResults:
          results.filter(
            (result) =>
              result &&
              result.status ===
                OPTIMIZATION_STATUS.SKIPPED
          ),

        failedResults:
          results.filter(
            (result) =>
              !result ||
              result.status ===
                OPTIMIZATION_STATUS.FAILED ||
              result.status ===
                OPTIMIZATION_STATUS.UNSUPPORTED
          ),

        outputFiles:
          results
            .map((result) =>
              result
                ? result.outputFile
                : null
            )
            .filter(Boolean)
      };

      emit(
        "media:image-optimization:batch:complete",
        summary
      );

      syncStore(
        `mediaLibrary.imageOptimization.batches.${batchId}`,
        {
          batchId,
          total: summary.total,
          completed:
            summary.completed,
          optimized:
            summary.optimized,
          skipped:
            summary.skipped,
          failed:
            summary.failed,
          cancelled:
            summary.cancelled,
          originalBytes:
            summary.originalBytes,
          outputBytes:
            summary.outputBytes,
          savings:
            summary.savings,
          results:
            summary.results.map(
              (result) =>
                result
                  ? result.toJSON()
                  : null
            )
        }
      );

      return summary;
    }

    cancel(id, reason) {
      const controller =
        this.activeControllers.get(
          normalizeString(id)
        );

      if (!controller) {
        return false;
      }

      controller.abort(
        reason instanceof Error
          ? reason
          : createAbortError(
              normalizeString(reason) ||
                "Image optimization cancelled."
            )
      );

      return true;
    }

    cancelAll(reason) {
      let cancelled = 0;

      for (
        const controller of
        this.activeControllers.values()
      ) {
        if (!controller.signal.aborted) {
          controller.abort(
            reason instanceof Error
              ? reason
              : createAbortError(
                  normalizeString(reason) ||
                    "All image optimization tasks were cancelled."
                )
          );

          cancelled += 1;
        }
      }

      return cancelled;
    }

    clearCache() {
      this.cache.clear();
    }

    getSnapshot() {
      return {
        initialized: true,
        disposed: this.disposed,
        activeTasks:
          this.activeControllers.size,
        cacheSize:
          this.cache.size,
        defaultOptions: {
          ...this.defaultOptions
        }
      };
    }

    dispose() {
      this.cancelAll(
        "Image optimization engine disposed."
      );

      this.cache.clear();
      this.activeControllers.clear();
      this.activeResults.clear();
      this.disposed = true;

      emit(
        "media:image-optimization:disposed",
        {
          engine: this
        }
      );
    }
  }

  /* =========================================================
     UPLOAD INTEGRATION
  ========================================================= */

  class ImageOptimizationUploadIntegration {
    constructor(engine) {
      this.engine = engine;
      this.enabled = true;
      this.bound = false;
      this.unsubscribe = [];
      this.resultsByUploadId =
        new Map();
    }

    bind() {
      if (this.bound) {
        return this;
      }

      this.bound = true;

      const queue =
        uploads.queue ||
        uploads.uploadQueue ||
        null;

      if (
        queue &&
        typeof queue.use === "function"
      ) {
        const middleware =
          async (context, next) => {
            if (!this.enabled) {
              return next();
            }

            const file =
              context.file ||
              (
                context.item &&
                context.item.file
              );

            if (
              !isFile(file) ||
              !isSupportedImage(file)
            ) {
              return next();
            }

            const imageOptions =
              context.imageOptimizationOptions ||
              (
                context.item &&
                context.item
                  .imageOptimizationOptions
              ) ||
              {};

            const shouldOptimize =
              context.optimizeImage !==
                false &&
              imageOptions.enabled !==
                false;

            if (!shouldOptimize) {
              return next();
            }

            const result =
              await this.engine.optimize(
                file,
                {
                  ...imageOptions,
                  signal:
                    context.signal,
                  output:
                    OUTPUT_TYPE.FILE,
                  notifyOnFailure:
                    false
                }
              );

            context.imageOptimization =
              result;

            if (
              result.status ===
                OPTIMIZATION_STATUS.READY &&
              result.outputFile
            ) {
              context.originalFile =
                file;

              context.file =
                result.outputFile;

              if (context.item) {
                context.item.originalFile =
                  file;

                context.item.file =
                  result.outputFile;

                context.item.imageOptimization =
                  result;
              }
            } else if (
              context.item
            ) {
              context.item.imageOptimization =
                result;
            }

            const uploadId =
              context.uploadId ||
              (
                context.item &&
                (
                  context.item.id ||
                  context.item.uploadId
                )
              );

            if (uploadId) {
              this.resultsByUploadId.set(
                String(uploadId),
                result
              );
            }

            return next();
          };

        const unbind =
          queue.use(middleware);

        if (
          typeof unbind === "function"
        ) {
          this.unsubscribe.push(
            unbind
          );
        }
      }

      if (
        uploads.manager &&
        typeof uploads.manager
          .setImageOptimizer ===
          "function"
      ) {
        uploads.manager
          .setImageOptimizer(
            (file, options) =>
              this.engine.optimize(
                file,
                options
              )
          );
      }

      emit(
        "media:image-optimization:integration:bound",
        {
          integration:
            "upload-system"
        }
      );

      return this;
    }

    getByUploadId(uploadId) {
      return (
        this.resultsByUploadId.get(
          String(uploadId)
        ) || null
      );
    }

    releaseByUploadId(uploadId) {
      const key =
        String(uploadId);

      const result =
        this.resultsByUploadId.get(
          key
        );

      if (!result) {
        return false;
      }

      if (
        typeof result.dispose ===
        "function"
      ) {
        result.dispose();
      }

      this.resultsByUploadId.delete(
        key
      );

      return true;
    }

    enable() {
      this.enabled = true;
      return this;
    }

    disable() {
      this.enabled = false;
      return this;
    }

    unbind() {
      while (
        this.unsubscribe.length > 0
      ) {
        const unsubscribe =
          this.unsubscribe.pop();

        try {
          unsubscribe();
        } catch (error) {
          console.error(
            "[AIFTMediaLibrary] Image optimization integration cleanup failed.",
            error
          );
        }
      }

      for (
        const result of
        this.resultsByUploadId.values()
      ) {
        if (
          result &&
          typeof result.dispose ===
            "function"
        ) {
          result.dispose();
        }
      }

      this.resultsByUploadId.clear();
      this.bound = false;

      emit(
        "media:image-optimization:integration:unbound",
        {
          integration:
            "upload-system"
        }
      );

      return this;
    }
  }

  /* =========================================================
     PREVIEW BINDER
  ========================================================= */

  class OptimizedImagePreviewBinder {
    constructor(engine) {
      this.engine = engine;
      this.bindings =
        new WeakMap();
    }

    async bind(element, file, options) {
      if (
        !element ||
        typeof element !== "object"
      ) {
        throw new TypeError(
          "A valid DOM element is required."
        );
      }

      this.unbind(element);

      const controller =
        new AbortController();

      const result =
        await this.engine.optimize(
          file,
          {
            ...(options || {}),
            signal:
              controller.signal,
            output:
              OUTPUT_TYPE.OBJECT_URL
          }
        );

      if (
        ![
          OPTIMIZATION_STATUS.READY,
          OPTIMIZATION_STATUS.SKIPPED
        ].includes(result.status)
      ) {
        return result;
      }

      let previewUrl =
        result.objectUrl;

      let createdFallbackUrl =
        false;

      if (!previewUrl) {
        const previewSource =
          result.outputFile ||
          result.blob ||
          file;

        previewUrl =
          URL.createObjectURL(
            previewSource
          );

        createdFallbackUrl =
          true;
      }

      this.bindings.set(
        element,
        {
          result,
          controller,
          previewUrl,
          createdFallbackUrl
        }
      );

      if (
        typeof HTMLImageElement !==
          "undefined" &&
        element instanceof
          HTMLImageElement
      ) {
        element.src =
          previewUrl;
      } else {
        element.style.backgroundImage =
          `url("${previewUrl}")`;

        element.style.backgroundSize =
          options &&
          options.cssFit
            ? options.cssFit
            : "cover";

        element.style.backgroundPosition =
          options &&
          options.cssPosition
            ? options.cssPosition
            : "center";

        element.style.backgroundRepeat =
          "no-repeat";
      }

      element.dataset
        .aiftImageOptimizationId =
        result.id;

      return result;
    }

    unbind(element) {
      const binding =
        this.bindings.get(element);

      if (!binding) {
        return false;
      }

      binding.controller.abort(
        createAbortError(
          "Optimized preview binding removed."
        )
      );

      if (
        binding.createdFallbackUrl &&
        binding.previewUrl &&
        typeof URL !== "undefined"
      ) {
        URL.revokeObjectURL(
          binding.previewUrl
        );
      }

      if (
        binding.result &&
        typeof binding.result.dispose ===
          "function"
      ) {
        binding.result.dispose();
      }

      if (
        typeof HTMLImageElement !==
          "undefined" &&
        element instanceof
          HTMLImageElement
      ) {
        element.removeAttribute(
          "src"
        );
      } else if (element.style) {
        element.style.backgroundImage =
          "";
      }

      if (element.dataset) {
        delete element.dataset
          .aiftImageOptimizationId;
      }

      this.bindings.delete(
        element
      );

      return true;
    }
  }

  /* =========================================================
     PUBLIC INITIALIZATION
  ========================================================= */

  const imageOptimizationEngine =
    new ImageOptimizationEngine();

  const uploadIntegration =
    new ImageOptimizationUploadIntegration(
      imageOptimizationEngine
    );

  const previewBinder =
    new OptimizedImagePreviewBinder(
      imageOptimizationEngine
    );

  uploadIntegration.bind();

  const imageOptimizationApi = {
    constants: {
      status:
        OPTIMIZATION_STATUS,
      strategy:
        OPTIMIZATION_STRATEGY,
      format:
        IMAGE_FORMAT,
      resizeMode:
        RESIZE_MODE,
      output:
        OUTPUT_TYPE,
      transparency:
        TRANSPARENCY_MODE,
      orientation:
        ORIENTATION_MODE,
      colorSpace:
        COLOR_SPACE
    },

    engine:
      imageOptimizationEngine,

    processor:
      imageOptimizationEngine.processor,

    cache:
      imageOptimizationEngine.cache,

    uploadIntegration,
    previewBinder,

    optimize(file, options) {
      return imageOptimizationEngine.optimize(
        file,
        options
      );
    },

    optimizeBatch(files, options) {
      return imageOptimizationEngine.optimizeBatch(
        files,
        options
      );
    },

    cancel(id, reason) {
      return imageOptimizationEngine.cancel(
        id,
        reason
      );
    },

    cancelAll(reason) {
      return imageOptimizationEngine.cancelAll(
        reason
      );
    },

    clearCache() {
      return imageOptimizationEngine.clearCache();
    },

    bindPreview(element, file, options) {
      return previewBinder.bind(
        element,
        file,
        options
      );
    },

    unbindPreview(element) {
      return previewBinder.unbind(
        element
      );
    },

    getPreset(strategy) {
      const preset =
        STRATEGY_PRESETS[strategy];

      return preset
        ? {
            ...preset
          }
        : null;
    },

    getSnapshot() {
      return imageOptimizationEngine.getSnapshot();
    },

    dispose() {
      uploadIntegration.unbind();
      imageOptimizationEngine.dispose();
    }
  };

  uploads.imageOptimization =
    imageOptimizationApi;

  uploads.imageOptimizer =
    imageOptimizationEngine;

  mediaLibrary.imageOptimization =
    imageOptimizationApi;

  mediaLibrary.imageOptimizer =
    imageOptimizationApi;

  mediaLibrary.imageOptimizationEngine =
    imageOptimizationEngine;

  mediaLibrary.optimizeMediaImage =
    function optimizeMediaImage(
      file,
      options
    ) {
      return imageOptimizationEngine.optimize(
        file,
        options
      );
    };

  mediaLibrary.optimizeMediaImages =
    function optimizeMediaImages(
      files,
      options
    ) {
      return imageOptimizationEngine.optimizeBatch(
        files,
        options
      );
    };

  mediaLibrary.bindOptimizedImagePreview =
    function bindOptimizedImagePreview(
      element,
      file,
      options
    ) {
      return previewBinder.bind(
        element,
        file,
        options
      );
    };

  mediaLibrary.unbindOptimizedImagePreview =
    function unbindOptimizedImagePreview(
      element
    ) {
      return previewBinder.unbind(
        element
      );
    };

  mediaLibrary.getImageOptimizationSnapshot =
    function getImageOptimizationSnapshot() {
      return imageOptimizationEngine.getSnapshot();
    };

  mediaLibrary.__imageOptimizationEngineInitialized =
    true;

  emit(
    "media:image-optimization:initialized",
    {
      engine:
        imageOptimizationEngine,
      snapshot:
        imageOptimizationEngine.getSnapshot()
    }
  );
})(window);
/* =========================================================
   AIFT MEDIA LIBRARY
   PART 2H OF 15
   VIDEO PROCESSING ENGINE
========================================================= */

(function initializeAIFTVideoProcessingEngine(global) {
  "use strict";

  const mediaLibrary = global.AIFTMediaLibrary;

  if (!mediaLibrary) {
    throw new Error(
      "AIFTMediaLibrary must be initialized before loading Part 2H."
    );
  }

  if (mediaLibrary.__videoProcessingEngineInitialized) {
    return;
  }

  const uploads = mediaLibrary.uploads || (mediaLibrary.uploads = {});
  const eventBus = mediaLibrary.events || mediaLibrary.eventBus || null;
  const store = mediaLibrary.store || null;
  const notifications = mediaLibrary.notifications || null;

  const validationApi =
    mediaLibrary.validation ||
    mediaLibrary.fileValidation ||
    uploads.validation ||
    null;

  const thumbnailApi =
    mediaLibrary.thumbnails ||
    mediaLibrary.thumbnailGenerator ||
    uploads.thumbnails ||
    null;

  /* =========================================================
     CONSTANTS
  ========================================================= */

  const VIDEO_PROCESSING_STATUS = Object.freeze({
    PENDING: "pending",
    QUEUED: "queued",
    VALIDATING: "validating",
    INSPECTING: "inspecting",
    PREPARING: "preparing",
    TRANSCODING: "transcoding",
    EXTRACTING_THUMBNAIL: "extracting-thumbnail",
    FINALIZING: "finalizing",
    READY: "ready",
    SKIPPED: "skipped",
    FAILED: "failed",
    CANCELLED: "cancelled",
    UNSUPPORTED: "unsupported"
  });

  const VIDEO_PROCESSING_MODE = Object.freeze({
    PASSTHROUGH: "passthrough",
    TRANSCODE_WHEN_NEEDED: "transcode-when-needed",
    ALWAYS_TRANSCODE: "always-transcode"
  });

  const VIDEO_OUTPUT = Object.freeze({
    BLOB: "blob",
    FILE: "file",
    OBJECT_URL: "object-url",
    ARRAY_BUFFER: "array-buffer"
  });

  const VIDEO_CONTAINER = Object.freeze({
    ORIGINAL: "original",
    MP4: "video/mp4",
    WEBM: "video/webm"
  });

  const VIDEO_CODEC = Object.freeze({
    ORIGINAL: "original",
    H264: "avc1",
    VP8: "vp8",
    VP9: "vp09",
    AV1: "av01"
  });

  const AUDIO_CODEC = Object.freeze({
    ORIGINAL: "original",
    AAC: "mp4a",
    OPUS: "opus",
    VORBIS: "vorbis",
    NONE: "none"
  });

  const VIDEO_QUALITY_PRESET = Object.freeze({
    SOURCE: "source",
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    ULTRA: "ultra",
    CUSTOM: "custom"
  });

  const VIDEO_FIT = Object.freeze({
    CONTAIN: "contain",
    COVER: "cover",
    STRETCH: "stretch"
  });

  const VIDEO_FRAME_RATE_MODE = Object.freeze({
    SOURCE: "source",
    LIMIT: "limit",
    EXACT: "exact"
  });

  const DEFAULT_OPTIONS = Object.freeze({
    mode: VIDEO_PROCESSING_MODE.TRANSCODE_WHEN_NEEDED,
    output: VIDEO_OUTPUT.FILE,

    container: VIDEO_CONTAINER.MP4,
    videoCodec: VIDEO_CODEC.H264,
    audioCodec: AUDIO_CODEC.AAC,

    qualityPreset: VIDEO_QUALITY_PRESET.HIGH,
    videoBitrate: null,
    audioBitrate: 128000,

    maxWidth: 1920,
    maxHeight: 1080,
    targetWidth: null,
    targetHeight: null,
    fit: VIDEO_FIT.CONTAIN,
    allowUpscale: false,

    frameRateMode: VIDEO_FRAME_RATE_MODE.LIMIT,
    targetFrameRate: 30,
    maximumFrameRate: 60,

    maximumDurationSeconds: 6 * 60 * 60,
    minimumDurationSeconds: 0.1,
    maximumSourceBytes: 20 * 1024 * 1024 * 1024,

    trimStartSeconds: 0,
    trimEndSeconds: null,

    preserveAudio: true,
    mute: false,

    filenameSuffix: "-processed",
    preserveOriginalWhenSmaller: true,
    minimumSavingsBytes: 1024 * 1024,
    minimumSavingsRatio: 0.02,

    generateThumbnail: true,
    thumbnailTime: null,
    thumbnailPercentage: 0.25,
    thumbnailOptions: {
      width: 640,
      height: 360,
      output: "blob"
    },

    validateBeforeProcessing: true,
    rejectInvalidFiles: true,

    useNativeWebCodecs: true,
    allowMediaRecorderFallback: true,
    allowPassthroughFallback: true,

    decodeTimeoutMs: 20000,
    seekTimeoutMs: 15000,
    processingTimeoutMs: 30 * 60 * 1000,

    concurrency: 1,
    notifyOnFailure: false,
    notifyOnSkip: false
  });

  const QUALITY_PRESETS = Object.freeze({
    [VIDEO_QUALITY_PRESET.SOURCE]: {
      maxWidth: 8192,
      maxHeight: 8192,
      targetFrameRate: 60,
      videoBitrate: null,
      audioBitrate: 192000
    },

    [VIDEO_QUALITY_PRESET.LOW]: {
      maxWidth: 854,
      maxHeight: 480,
      targetFrameRate: 24,
      videoBitrate: 1200000,
      audioBitrate: 96000
    },

    [VIDEO_QUALITY_PRESET.MEDIUM]: {
      maxWidth: 1280,
      maxHeight: 720,
      targetFrameRate: 30,
      videoBitrate: 2800000,
      audioBitrate: 128000
    },

    [VIDEO_QUALITY_PRESET.HIGH]: {
      maxWidth: 1920,
      maxHeight: 1080,
      targetFrameRate: 30,
      videoBitrate: 6000000,
      audioBitrate: 128000
    },

    [VIDEO_QUALITY_PRESET.ULTRA]: {
      maxWidth: 3840,
      maxHeight: 2160,
      targetFrameRate: 60,
      videoBitrate: 18000000,
      audioBitrate: 192000
    }
  });

  const VIDEO_EXTENSIONS = new Set([
    "mp4",
    "m4v",
    "mov",
    "webm",
    "mkv",
    "avi",
    "mpg",
    "mpeg",
    "ogv"
  ]);

  const PASSTHROUGH_MIME_TYPES = new Set([
    "video/mp4",
    "video/webm"
  ]);

  const CONTAINER_EXTENSION_MAP = Object.freeze({
    "video/mp4": "mp4",
    "video/webm": "webm"
  });

  /* =========================================================
     UTILITIES
  ========================================================= */

  function now() {
    return Date.now();
  }

  function createId(prefix) {
    const random =
      global.crypto &&
      typeof global.crypto.randomUUID === "function"
        ? global.crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    return `${prefix || "video_processing"}_${random}`;
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeMime(value) {
    return normalizeString(value).toLowerCase().split(";")[0].trim();
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function isBlob(value) {
    return typeof Blob !== "undefined" && value instanceof Blob;
  }

  function isFile(value) {
    return typeof File !== "undefined" && value instanceof File;
  }

  function getExtension(filename) {
    const value = normalizeString(filename);
    const index = value.lastIndexOf(".");

    if (index <= 0 || index === value.length - 1) {
      return "";
    }

    return value.slice(index + 1).toLowerCase();
  }

  function getFilenameWithoutExtension(filename) {
    const value = normalizeString(filename);
    const index = value.lastIndexOf(".");

    if (index <= 0) {
      return value;
    }

    return value.slice(0, index);
  }

  function createAbortError(message) {
    try {
      return new DOMException(
        message || "Video processing aborted.",
        "AbortError"
      );
    } catch (error) {
      const abortError = new Error(
        message || "Video processing aborted."
      );

      abortError.name = "AbortError";
      return abortError;
    }
  }

  function throwIfAborted(signal) {
    if (signal && signal.aborted) {
      throw signal.reason || createAbortError();
    }
  }

  function emit(name, payload) {
    if (!eventBus) {
      return;
    }

    try {
      if (typeof eventBus.emit === "function") {
        eventBus.emit(name, payload);
      } else if (typeof eventBus.dispatch === "function") {
        eventBus.dispatch(name, payload);
      } else if (typeof eventBus.publish === "function") {
        eventBus.publish(name, payload);
      }
    } catch (error) {
      console.error(
        `[AIFTMediaLibrary] Event emission failed: ${name}`,
        error
      );
    }
  }

  function notify(type, message, options) {
    if (!notifications) {
      return;
    }

    try {
      if (typeof notifications[type] === "function") {
        notifications[type](message, options);
      } else if (typeof notifications.show === "function") {
        notifications.show({
          type,
          message,
          ...(options || {})
        });
      }
    } catch (error) {
      console.error(
        "[AIFTMediaLibrary] Video processing notification failed.",
        error
      );
    }
  }

  function syncStore(path, value) {
    if (!store) {
      return;
    }

    try {
      if (typeof store.set === "function") {
        store.set(path, value);
      } else if (typeof store.update === "function") {
        store.update(path, value);
      } else if (typeof store.dispatch === "function") {
        store.dispatch({
          type: "MEDIA_VIDEO_PROCESSING_UPDATE",
          payload: {
            path,
            value
          }
        });
      }
    } catch (error) {
      console.error(
        "[AIFTMediaLibrary] Video processing store sync failed.",
        error
      );
    }
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    if (value < 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function inferVideoMime(file) {
    const mime = normalizeMime(file && file.type);

    if (mime.startsWith("video/")) {
      return mime;
    }

    const extension = getExtension(file && file.name);

    if (["mp4", "m4v"].includes(extension)) {
      return "video/mp4";
    }

    if (extension === "webm") {
      return "video/webm";
    }

    if (extension === "mov") {
      return "video/quicktime";
    }

    if (extension === "avi") {
      return "video/x-msvideo";
    }

    if (["mpg", "mpeg"].includes(extension)) {
      return "video/mpeg";
    }

    return "";
  }

  function isSupportedVideo(file) {
    if (!file) {
      return false;
    }

    const mime = inferVideoMime(file);
    const extension = getExtension(file.name);

    return (
      mime.startsWith("video/") ||
      VIDEO_EXTENSIONS.has(extension)
    );
  }

  function normalizeOptions(options) {
    const supplied = options || {};
    const qualityPreset =
      supplied.qualityPreset ||
      DEFAULT_OPTIONS.qualityPreset;

    const preset =
      QUALITY_PRESETS[qualityPreset] || {};

    const merged = {
      ...DEFAULT_OPTIONS,
      ...preset,
      ...supplied,
      qualityPreset
    };

    merged.maxWidth = clamp(
      Number.isFinite(Number(merged.maxWidth))
        ? Math.round(Number(merged.maxWidth))
        : DEFAULT_OPTIONS.maxWidth,
      1,
      8192
    );

    merged.maxHeight = clamp(
      Number.isFinite(Number(merged.maxHeight))
        ? Math.round(Number(merged.maxHeight))
        : DEFAULT_OPTIONS.maxHeight,
      1,
      8192
    );

    merged.targetWidth = Number.isFinite(Number(merged.targetWidth))
      ? clamp(Math.round(Number(merged.targetWidth)), 1, 8192)
      : null;

    merged.targetHeight = Number.isFinite(Number(merged.targetHeight))
      ? clamp(Math.round(Number(merged.targetHeight)), 1, 8192)
      : null;

    merged.videoBitrate =
      Number.isFinite(Number(merged.videoBitrate)) &&
      Number(merged.videoBitrate) > 0
        ? Math.round(Number(merged.videoBitrate))
        : null;

    merged.audioBitrate =
      Number.isFinite(Number(merged.audioBitrate)) &&
      Number(merged.audioBitrate) > 0
        ? Math.round(Number(merged.audioBitrate))
        : DEFAULT_OPTIONS.audioBitrate;

    merged.targetFrameRate = clamp(
      Number.isFinite(Number(merged.targetFrameRate))
        ? Number(merged.targetFrameRate)
        : DEFAULT_OPTIONS.targetFrameRate,
      1,
      120
    );

    merged.maximumFrameRate = clamp(
      Number.isFinite(Number(merged.maximumFrameRate))
        ? Number(merged.maximumFrameRate)
        : DEFAULT_OPTIONS.maximumFrameRate,
      1,
      240
    );

    merged.trimStartSeconds = Math.max(
      0,
      Number(merged.trimStartSeconds) || 0
    );

    merged.trimEndSeconds =
      Number.isFinite(Number(merged.trimEndSeconds))
        ? Math.max(0, Number(merged.trimEndSeconds))
        : null;

    merged.thumbnailPercentage = clamp(
      Number.isFinite(Number(merged.thumbnailPercentage))
        ? Number(merged.thumbnailPercentage)
        : DEFAULT_OPTIONS.thumbnailPercentage,
      0,
      1
    );

    merged.concurrency = clamp(
      Number.isFinite(Number(merged.concurrency))
        ? Math.round(Number(merged.concurrency))
        : DEFAULT_OPTIONS.concurrency,
      1,
      4
    );

    if (!Object.values(VIDEO_PROCESSING_MODE).includes(merged.mode)) {
      merged.mode = DEFAULT_OPTIONS.mode;
    }

    if (!Object.values(VIDEO_OUTPUT).includes(merged.output)) {
      merged.output = DEFAULT_OPTIONS.output;
    }

    if (!Object.values(VIDEO_CONTAINER).includes(merged.container)) {
      merged.container = DEFAULT_OPTIONS.container;
    }

    if (!Object.values(VIDEO_CODEC).includes(merged.videoCodec)) {
      merged.videoCodec = DEFAULT_OPTIONS.videoCodec;
    }

    if (!Object.values(AUDIO_CODEC).includes(merged.audioCodec)) {
      merged.audioCodec = DEFAULT_OPTIONS.audioCodec;
    }

    if (!Object.values(VIDEO_FIT).includes(merged.fit)) {
      merged.fit = DEFAULT_OPTIONS.fit;
    }

    return merged;
  }

  function calculateSavings(originalBytes, outputBytes) {
    const original = Number(originalBytes) || 0;
    const output = Number(outputBytes) || 0;
    const savedBytes = original - output;
    const savingsRatio =
      original > 0
        ? savedBytes / original
        : 0;

    return {
      originalBytes: original,
      outputBytes: output,
      savedBytes,
      savingsRatio,
      savingsPercent: savingsRatio * 100
    };
  }

  function buildOutputFilename(file, container, options) {
    const originalName =
      file && file.name
        ? file.name
        : "video";

    const base =
      getFilenameWithoutExtension(originalName) ||
      "video";

    const extension =
      CONTAINER_EXTENSION_MAP[container] ||
      getExtension(originalName) ||
      "mp4";

    const suffix =
      normalizeString(options.filenameSuffix) ||
      "-processed";

    return `${base}${suffix}.${extension}`;
  }

  function waitForEvent(
    target,
    successEvent,
    failureEvents,
    timeoutMs,
    signal
  ) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer = null;

      const failures = Array.isArray(failureEvents)
        ? failureEvents
        : [failureEvents].filter(Boolean);

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        target.removeEventListener(successEvent, handleSuccess);

        for (const eventName of failures) {
          target.removeEventListener(eventName, handleFailure);
        }

        if (signal) {
          signal.removeEventListener("abort", handleAbort);
        }
      };

      const settle = (handler, value) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        handler(value);
      };

      const handleSuccess = (event) => {
        settle(resolve, event);
      };

      const handleFailure = () => {
        settle(
          reject,
          new Error(
            `Video element failed while waiting for "${successEvent}".`
          )
        );
      };

      const handleAbort = () => {
        settle(
          reject,
          signal.reason || createAbortError()
        );
      };

      target.addEventListener(successEvent, handleSuccess, {
        once: true
      });

      for (const eventName of failures) {
        target.addEventListener(eventName, handleFailure, {
          once: true
        });
      }

      if (signal) {
        if (signal.aborted) {
          handleAbort();
          return;
        }

        signal.addEventListener("abort", handleAbort, {
          once: true
        });
      }

      if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timer = setTimeout(() => {
          settle(
            reject,
            new Error(
              `Timed out while waiting for "${successEvent}".`
            )
          );
        }, timeoutMs);
      }
    });
  }

  /* =========================================================
     RESULT MODEL
  ========================================================= */

  class VideoProcessingResult {
    constructor(file, options) {
      this.id = createId("video_processing");
      this.file = file;
      this.fileName = file ? file.name : "";
      this.sourceMime = inferVideoMime(file);
      this.sourceBytes = file ? file.size : 0;

      this.status = VIDEO_PROCESSING_STATUS.PENDING;
      this.options = {
        ...options
      };

      this.metadata = {};
      this.validation = null;

      this.outputMime = null;
      this.outputBytes = 0;
      this.outputFile = null;
      this.blob = null;
      this.objectUrl = null;
      this.arrayBuffer = null;
      this.output = null;

      this.thumbnail = null;
      this.processingMethod = null;

      this.savings = {
        originalBytes: this.sourceBytes,
        outputBytes: 0,
        savedBytes: 0,
        savingsRatio: 0,
        savingsPercent: 0
      };

      this.progress = 0;
      this.error = null;
      this.skipReason = null;

      this.createdAt = now();
      this.startedAt = null;
      this.completedAt = null;
      this.durationMs = 0;
    }

    setStatus(status) {
      this.status = status;
      return this;
    }

    setProgress(progress) {
      this.progress = clamp(
        Number(progress) || 0,
        0,
        1
      );

      return this;
    }

    start() {
      this.startedAt = now();
      return this;
    }

    complete() {
      this.status = VIDEO_PROCESSING_STATUS.READY;
      this.progress = 1;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    skip(reason) {
      this.status = VIDEO_PROCESSING_STATUS.SKIPPED;
      this.skipReason =
        normalizeString(reason) ||
        "Video processing was not required.";
      this.progress = 1;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    unsupported(reason) {
      this.status = VIDEO_PROCESSING_STATUS.UNSUPPORTED;
      this.skipReason =
        normalizeString(reason) ||
        "This video format is unsupported.";
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    cancel() {
      this.status = VIDEO_PROCESSING_STATUS.CANCELLED;
      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    fail(error) {
      this.status = VIDEO_PROCESSING_STATUS.FAILED;
      this.error = {
        name:
          error && error.name
            ? error.name
            : "Error",
        message:
          error && error.message
            ? error.message
            : String(error || "Video processing failed."),
        stack:
          error && error.stack
            ? error.stack
            : null
      };

      this.completedAt = now();
      this.durationMs = this.startedAt
        ? this.completedAt - this.startedAt
        : 0;

      return this;
    }

    revokeObjectUrl() {
      if (
        this.objectUrl &&
        typeof URL !== "undefined" &&
        typeof URL.revokeObjectURL === "function"
      ) {
        URL.revokeObjectURL(this.objectUrl);
      }

      this.objectUrl = null;

      if (this.options.output === VIDEO_OUTPUT.OBJECT_URL) {
        this.output = null;
      }
    }

    dispose() {
      this.revokeObjectUrl();

      if (
        this.thumbnail &&
        typeof this.thumbnail.dispose === "function"
      ) {
        this.thumbnail.dispose();
      }

      this.thumbnail = null;
      this.arrayBuffer = null;
      this.output = null;
    }

    toJSON() {
      return {
        id: this.id,
        fileName: this.fileName,
        sourceMime: this.sourceMime,
        sourceBytes: this.sourceBytes,
        status: this.status,
        metadata: this.metadata,
        outputMime: this.outputMime,
        outputBytes: this.outputBytes,
        objectUrl: this.objectUrl,
        processingMethod: this.processingMethod,
        savings: this.savings,
        progress: this.progress,
        error: this.error,
        skipReason: this.skipReason,
        createdAt: this.createdAt,
        startedAt: this.startedAt,
        completedAt: this.completedAt,
        durationMs: this.durationMs
      };
    }
  }

  /* =========================================================
     METADATA INSPECTOR
  ========================================================= */

  class VideoMetadataInspector {
    async inspect(file, options) {
      const config = options || {};
      const signal = config.signal;

      throwIfAborted(signal);

      if (
        typeof document === "undefined" ||
        typeof URL === "undefined"
      ) {
        throw new Error(
          "Video metadata inspection is unavailable in this environment."
        );
      }

      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      try {
        const metadataLoaded = waitForEvent(
          video,
          "loadedmetadata",
          ["error", "abort"],
          config.decodeTimeoutMs,
          signal
        );

        video.src = objectUrl;

        await metadataLoaded;

        throwIfAborted(signal);

        const duration =
          Number.isFinite(video.duration)
            ? video.duration
            : 0;

        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;

        if (width <= 0 || height <= 0) {
          throw new Error(
            "The video did not report valid dimensions."
          );
        }

        const metadata = {
          duration,
          width,
          height,
          pixels: width * height,
          aspectRatio:
            height > 0
              ? width / height
              : null,
          mime: inferVideoMime(file),
          hasAudio: null,
          estimatedFrameRate: null,
          method: "html-video"
        };

        return metadata;
      } finally {
        video.pause();
        video.removeAttribute("src");

        try {
          video.load();
        } catch (error) {
          void error;
        }

        URL.revokeObjectURL(objectUrl);
      }
    }
  }

  /* =========================================================
     VIDEO RESIZE CALCULATOR
  ========================================================= */

  class VideoResizeCalculator {
    calculate(sourceWidth, sourceHeight, options) {
      const sourceRatio =
        sourceWidth / sourceHeight;

      let outputWidth = sourceWidth;
      let outputHeight = sourceHeight;
      let crop = null;

      if (
        options.targetWidth &&
        options.targetHeight &&
        options.fit === VIDEO_FIT.STRETCH
      ) {
        outputWidth = options.targetWidth;
        outputHeight = options.targetHeight;
      } else if (
        options.targetWidth &&
        options.targetHeight &&
        options.fit === VIDEO_FIT.COVER
      ) {
        outputWidth = options.targetWidth;
        outputHeight = options.targetHeight;

        const targetRatio =
          outputWidth / outputHeight;

        if (sourceRatio > targetRatio) {
          const cropWidth =
            sourceHeight * targetRatio;

          crop = {
            sourceX:
              (sourceWidth - cropWidth) / 2,
            sourceY: 0,
            sourceWidth: cropWidth,
            sourceHeight
          };
        } else {
          const cropHeight =
            sourceWidth / targetRatio;

          crop = {
            sourceX: 0,
            sourceY:
              (sourceHeight - cropHeight) / 2,
            sourceWidth,
            sourceHeight: cropHeight
          };
        }
      } else {
        const maximumWidth =
          options.targetWidth ||
          options.maxWidth ||
          sourceWidth;

        const maximumHeight =
          options.targetHeight ||
          options.maxHeight ||
          sourceHeight;

        const scale = Math.min(
          maximumWidth / sourceWidth,
          maximumHeight / sourceHeight
        );

        const effectiveScale =
          options.allowUpscale
            ? scale
            : Math.min(scale, 1);

        outputWidth = Math.max(
          2,
          Math.round(sourceWidth * effectiveScale)
        );

        outputHeight = Math.max(
          2,
          Math.round(sourceHeight * effectiveScale)
        );
      }

      if (outputWidth % 2 !== 0) {
        outputWidth -= 1;
      }

      if (outputHeight % 2 !== 0) {
        outputHeight -= 1;
      }

      return {
        sourceWidth,
        sourceHeight,
        outputWidth: Math.max(2, outputWidth),
        outputHeight: Math.max(2, outputHeight),
        crop
      };
    }
  }

  /* =========================================================
     CAPABILITY DETECTOR
  ========================================================= */

  class VideoCapabilityDetector {
    constructor() {
      this.cache = new Map();
    }

    hasMediaRecorder() {
      return typeof MediaRecorder !== "undefined";
    }

    hasWebCodecs() {
      return (
        typeof VideoEncoder !== "undefined" &&
        typeof VideoDecoder !== "undefined" &&
        typeof EncodedVideoChunk !== "undefined" &&
        typeof VideoFrame !== "undefined"
      );
    }

    canRecordMime(mimeType) {
      const normalized = normalizeMime(mimeType);

      if (!this.hasMediaRecorder()) {
        return false;
      }

      if (
        typeof MediaRecorder.isTypeSupported !== "function"
      ) {
        return true;
      }

      return MediaRecorder.isTypeSupported(normalized);
    }

    resolveRecorderMime(options) {
      const candidates =
        options.container === VIDEO_CONTAINER.WEBM
          ? [
              "video/webm;codecs=vp9,opus",
              "video/webm;codecs=vp8,opus",
              "video/webm"
            ]
          : [
              "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
              "video/mp4",
              "video/webm;codecs=vp9,opus",
              "video/webm;codecs=vp8,opus",
              "video/webm"
            ];

      for (const candidate of candidates) {
        if (this.canRecordMime(candidate)) {
          return candidate;
        }
      }

      return null;
    }

    async canEncodeVideo(config) {
      if (!this.hasWebCodecs()) {
        return false;
      }

      const key = JSON.stringify(config);

      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      try {
        const support =
          await VideoEncoder.isConfigSupported(config);

        const supported = Boolean(
          support && support.supported
        );

        this.cache.set(key, supported);
        return supported;
      } catch (error) {
        this.cache.set(key, false);
        return false;
      }
    }

    getSnapshot() {
      return {
        mediaRecorder: this.hasMediaRecorder(),
        webCodecs: this.hasWebCodecs()
      };
    }
  }

  /* =========================================================
     PASSTHROUGH PROCESSOR
  ========================================================= */

  class VideoPassthroughProcessor {
    canProcess(file, options) {
      const mime = inferVideoMime(file);

      if (options.mode === VIDEO_PROCESSING_MODE.ALWAYS_TRANSCODE) {
        return false;
      }

      if (options.container === VIDEO_CONTAINER.ORIGINAL) {
        return true;
      }

      return mime === options.container;
    }

    async process(file, options, signal) {
      throwIfAborted(signal);

      return {
        blob: file,
        mime: inferVideoMime(file) || file.type,
        method: "passthrough",
        metadata: {
          sourcePreserved: true
        }
      };
    }
  }

  /* =========================================================
     MEDIA RECORDER TRANSCODER
  ========================================================= */

  class MediaRecorderVideoTranscoder {
    constructor(capabilities) {
      this.capabilities = capabilities;
      this.resizeCalculator =
        new VideoResizeCalculator();
    }

    async transcode(file, metadata, options, signal, onProgress) {
      throwIfAborted(signal);

      if (
        typeof document === "undefined" ||
        typeof URL === "undefined"
      ) {
        throw new Error(
          "Browser video transcoding is unavailable in this environment."
        );
      }

      const recorderMime =
        this.capabilities.resolveRecorderMime(options);

      if (!recorderMime) {
        throw new Error(
          "No supported MediaRecorder video format is available."
        );
      }

      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      video.preload = "auto";
      video.muted = options.mute;
      video.playsInline = true;

      const resize =
        this.resizeCalculator.calculate(
          metadata.width,
          metadata.height,
          options
        );

      const canvas = document.createElement("canvas");
      canvas.width = resize.outputWidth;
      canvas.height = resize.outputHeight;

      const context = canvas.getContext("2d", {
        alpha: false
      });

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        throw new Error(
          "Unable to create a canvas context for video processing."
        );
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const frameRate =
        this.resolveFrameRate(
          metadata,
          options
        );

      const canvasStream =
        canvas.captureStream(frameRate);

      const outputStream =
        new MediaStream();

      for (const track of canvasStream.getVideoTracks()) {
        outputStream.addTrack(track);
      }

      const chunks = [];
      let animationFrameId = null;
      let recorder = null;
      let audioContext = null;
      let mediaSourceNode = null;
      let audioDestination = null;

      try {
        const canCaptureSourceAudio =
          options.preserveAudio &&
          !options.mute &&
          typeof video.captureStream === "function";

        if (canCaptureSourceAudio) {
          const sourceStream =
            video.captureStream();

          for (const track of sourceStream.getAudioTracks()) {
            outputStream.addTrack(track);
          }
        } else if (
          options.preserveAudio &&
          !options.mute &&
          typeof AudioContext !== "undefined"
        ) {
          audioContext = new AudioContext();
          mediaSourceNode =
            audioContext.createMediaElementSource(video);
          audioDestination =
            audioContext.createMediaStreamDestination();

          mediaSourceNode.connect(audioDestination);
          mediaSourceNode.connect(audioContext.destination);

          for (
            const track of
            audioDestination.stream.getAudioTracks()
          ) {
            outputStream.addTrack(track);
          }
        }

        recorder = new MediaRecorder(
          outputStream,
          {
            mimeType: recorderMime,
            videoBitsPerSecond:
              options.videoBitrate || undefined,
            audioBitsPerSecond:
              options.audioBitrate || undefined
          }
        );

        const trimStart =
          clamp(
            options.trimStartSeconds,
            0,
            metadata.duration
          );

        const trimEnd =
          options.trimEndSeconds === null
            ? metadata.duration
            : clamp(
                options.trimEndSeconds,
                trimStart,
                metadata.duration
              );

        const targetDuration =
          Math.max(
            0,
            trimEnd - trimStart
          );

        const recordingComplete =
          new Promise((resolve, reject) => {
            recorder.addEventListener(
              "dataavailable",
              (event) => {
                if (
                  event.data &&
                  event.data.size > 0
                ) {
                  chunks.push(event.data);
                }
              }
            );

            recorder.addEventListener(
              "stop",
              resolve,
              {
                once: true
              }
            );

            recorder.addEventListener(
              "error",
              (event) => {
                reject(
                  event.error ||
                    new Error(
                      "MediaRecorder video processing failed."
                    )
                );
              },
              {
                once: true
              }
            );
          });

        const metadataLoaded =
          waitForEvent(
            video,
            "loadedmetadata",
            ["error", "abort"],
            options.decodeTimeoutMs,
            signal
          );

        video.src = objectUrl;

        await metadataLoaded;

        if (trimStart > 0) {
          const seeked = waitForEvent(
            video,
            "seeked",
            ["error", "abort"],
            options.seekTimeoutMs,
            signal
          );

          video.currentTime = trimStart;
          await seeked;
        }

        throwIfAborted(signal);

        const drawFrame = () => {
          const crop = resize.crop || {
            sourceX: 0,
            sourceY: 0,
            sourceWidth: metadata.width,
            sourceHeight: metadata.height
          };

          context.fillStyle = "#000000";
          context.fillRect(
            0,
            0,
            resize.outputWidth,
            resize.outputHeight
          );

          context.drawImage(
            video,
            crop.sourceX,
            crop.sourceY,
            crop.sourceWidth,
            crop.sourceHeight,
            0,
            0,
            resize.outputWidth,
            resize.outputHeight
          );

          const elapsed =
            Math.max(
              0,
              video.currentTime - trimStart
            );

          const progress =
            targetDuration > 0
              ? clamp(
                  elapsed / targetDuration,
                  0,
                  1
                )
              : 1;

          if (typeof onProgress === "function") {
            onProgress(progress);
          }

          if (
            video.currentTime >= trimEnd ||
            video.ended ||
            signal.aborted
          ) {
            if (
              recorder &&
              recorder.state !== "inactive"
            ) {
              recorder.stop();
            }

            return;
          }

          animationFrameId =
            global.requestAnimationFrame(
              drawFrame
            );
        };

        recorder.start(1000);

        animationFrameId =
          global.requestAnimationFrame(
            drawFrame
          );

        await video.play();

        await Promise.race([
          recordingComplete,
          new Promise((_, reject) => {
            const timer = setTimeout(() => {
              reject(
                new Error(
                  "Video processing exceeded the configured timeout."
                )
              );
            }, options.processingTimeoutMs);

            recordingComplete.finally(() => {
              clearTimeout(timer);
            });
          })
        ]);

        throwIfAborted(signal);

        const blob = new Blob(
          chunks,
          {
            type: recorderMime.split(";")[0]
          }
        );

        return {
          blob,
          mime:
            recorderMime.split(";")[0],
          method: "media-recorder",
          metadata: {
            recorderMime,
            frameRate,
            resize,
            trimStart,
            trimEnd,
            duration: targetDuration
          }
        };
      } finally {
        if (animationFrameId !== null) {
          global.cancelAnimationFrame(
            animationFrameId
          );
        }

        if (
          recorder &&
          recorder.state !== "inactive"
        ) {
          try {
            recorder.stop();
          } catch (error) {
            void error;
          }
        }

        video.pause();
        video.removeAttribute("src");

        try {
          video.load();
        } catch (error) {
          void error;
        }

        for (const track of outputStream.getTracks()) {
          track.stop();
        }

        for (const track of canvasStream.getTracks()) {
          track.stop();
        }

        if (mediaSourceNode) {
          try {
            mediaSourceNode.disconnect();
          } catch (error) {
            void error;
          }
        }

        if (audioDestination) {
          try {
            audioDestination.disconnect();
          } catch (error) {
            void error;
          }
        }

        if (audioContext) {
          try {
            await audioContext.close();
          } catch (error) {
            void error;
          }
        }

        URL.revokeObjectURL(objectUrl);
      }
    }

    resolveFrameRate(metadata, options) {
      const sourceRate =
        Number(metadata.estimatedFrameRate) ||
        options.targetFrameRate;

      if (
        options.frameRateMode ===
        VIDEO_FRAME_RATE_MODE.SOURCE
      ) {
        return clamp(
          sourceRate,
          1,
          options.maximumFrameRate
        );
      }

      if (
        options.frameRateMode ===
        VIDEO_FRAME_RATE_MODE.EXACT
      ) {
        return options.targetFrameRate;
      }

      return Math.min(
        sourceRate,
        options.targetFrameRate,
        options.maximumFrameRate
      );
    }
  }

  /* =========================================================
     PROCESSOR
  ========================================================= */

  class VideoProcessingProcessor {
    constructor(options) {
      const config = options || {};

      this.metadataInspector =
        config.metadataInspector ||
        new VideoMetadataInspector();

      this.capabilities =
        config.capabilities ||
        new VideoCapabilityDetector();

      this.passthroughProcessor =
        config.passthroughProcessor ||
        new VideoPassthroughProcessor();

      this.mediaRecorderTranscoder =
        config.mediaRecorderTranscoder ||
        new MediaRecorderVideoTranscoder(
          this.capabilities
        );

      this.customTranscoders = [];
    }

    registerTranscoder(transcoder) {
      if (
        !transcoder ||
        typeof transcoder.canProcess !== "function" ||
        typeof transcoder.transcode !== "function"
      ) {
        throw new TypeError(
          "Custom video transcoders require canProcess and transcode functions."
        );
      }

      this.customTranscoders.push({
        priority:
          Number.isFinite(transcoder.priority)
            ? transcoder.priority
            : 100,
        ...transcoder
      });

      this.customTranscoders.sort(
        (left, right) =>
          left.priority - right.priority
      );

      return transcoder;
    }

    unregisterTranscoder(id) {
      const index =
        this.customTranscoders.findIndex(
          (transcoder) =>
            transcoder.id === id
        );

      if (index === -1) {
        return false;
      }

      this.customTranscoders.splice(
        index,
        1
      );

      return true;
    }

    async inspect(file, options, signal) {
      return this.metadataInspector.inspect(
        file,
        {
          ...options,
          signal
        }
      );
    }

    async process(
      file,
      metadata,
      options,
      signal,
      onProgress
    ) {
      throwIfAborted(signal);

      if (
        options.mode ===
          VIDEO_PROCESSING_MODE.PASSTHROUGH ||
        this.passthroughProcessor.canProcess(
          file,
          options
        )
      ) {
        return this.passthroughProcessor.process(
          file,
          options,
          signal
        );
      }

      for (const transcoder of this.customTranscoders) {
        throwIfAborted(signal);

        const supported =
          await transcoder.canProcess({
            file,
            metadata,
            options,
            signal,
            capabilities: this.capabilities
          });

        if (supported) {
          return transcoder.transcode({
            file,
            metadata,
            options,
            signal,
            onProgress
          });
        }
      }

      if (
        options.allowMediaRecorderFallback &&
        this.capabilities.hasMediaRecorder()
      ) {
        return this.mediaRecorderTranscoder.transcode(
          file,
          metadata,
          options,
          signal,
          onProgress
        );
      }

      if (options.allowPassthroughFallback) {
        return this.passthroughProcessor.process(
          file,
          options,
          signal
        );
      }

      throw new Error(
        "No compatible video transcoder is available in this browser."
      );
    }
  }

  /* =========================================================
     ENGINE
  ========================================================= */

  class VideoProcessingEngine {
    constructor(options) {
      const config = options || {};

      this.defaultOptions =
        normalizeOptions(
          config.defaultOptions
        );

      this.processor =
        config.processor ||
        new VideoProcessingProcessor(
          config.processorOptions
        );

      this.activeControllers =
        new Map();

      this.activeResults =
        new Map();

      this.disposed = false;
    }

    async process(file, options) {
      if (this.disposed) {
        throw new Error(
          "The video processing engine has been disposed."
        );
      }

      if (!isFile(file) && !isBlob(file)) {
        throw new TypeError(
          "Video processing requires a File or Blob."
        );
      }

      const config =
        normalizeOptions({
          ...this.defaultOptions,
          ...(options || {})
        });

      const result =
        new VideoProcessingResult(
          file,
          config
        );

      if (!isSupportedVideo(file)) {
        result
          .start()
          .unsupported(
            "The selected file is not a supported video."
          );

        emit(
          "media:video-processing:unsupported",
          {
            file,
            result
          }
        );

        return result;
      }

      if (
        file.size >
        config.maximumSourceBytes
      ) {
        result
          .start()
          .fail(
            new Error(
              `The selected video exceeds the configured maximum size of ${formatBytes(
                config.maximumSourceBytes
              )}.`
            )
          );

        return result;
      }

      const controller =
        new AbortController();

      if (config.signal) {
        if (config.signal.aborted) {
          controller.abort(
            config.signal.reason ||
              createAbortError()
          );
        } else {
          config.signal.addEventListener(
            "abort",
            () => {
              controller.abort(
                config.signal.reason ||
                  createAbortError()
              );
            },
            {
              once: true
            }
          );
        }
      }

      this.activeControllers.set(
        result.id,
        controller
      );

      this.activeResults.set(
        result.id,
        result
      );

      result.start();

      emit(
        "media:video-processing:start",
        {
          file,
          options: config,
          result
        }
      );

      syncStore(
        `mediaLibrary.videoProcessing.active.${result.id}`,
        result.toJSON()
      );

      try {
        throwIfAborted(
          controller.signal
        );

        if (
          config.validateBeforeProcessing &&
          validationApi &&
          typeof validationApi.validate ===
            "function"
        ) {
          result.setStatus(
            VIDEO_PROCESSING_STATUS.VALIDATING
          );

          const validation =
            await validationApi.validate(
              file,
              {
                signal:
                  controller.signal,
                notify: false,
                useCache: true
              }
            );

          result.validation =
            validation;

          result.metadata.validation =
            typeof validation.toJSON ===
            "function"
              ? validation.toJSON()
              : validation;

          if (
            config.rejectInvalidFiles &&
            validation &&
            validation.valid === false
          ) {
            const error = new Error(
              "The video failed validation and cannot be processed."
            );

            error.name =
              "VideoProcessingValidationError";

            error.validation =
              validation;

            throw error;
          }
        }

        result.setStatus(
          VIDEO_PROCESSING_STATUS.INSPECTING
        );

        emit(
          "media:video-processing:stage",
          {
            id: result.id,
            file,
            stage:
              VIDEO_PROCESSING_STATUS.INSPECTING
          }
        );

        const metadata =
          await this.processor.inspect(
            file,
            config,
            controller.signal
          );

        result.metadata.source =
          metadata;

        this.validateMetadata(
          metadata,
          config
        );

        result.setStatus(
          VIDEO_PROCESSING_STATUS.PREPARING
        );

        emit(
          "media:video-processing:stage",
          {
            id: result.id,
            file,
            stage:
              VIDEO_PROCESSING_STATUS.PREPARING
          }
        );

        const shouldPassthrough =
          this.shouldUsePassthrough(
            file,
            metadata,
            config
          );

        const effectiveOptions = {
          ...config,
          mode: shouldPassthrough
            ? VIDEO_PROCESSING_MODE.PASSTHROUGH
            : config.mode
        };

        result.setStatus(
          shouldPassthrough
            ? VIDEO_PROCESSING_STATUS.FINALIZING
            : VIDEO_PROCESSING_STATUS.TRANSCODING
        );

        const processed =
          await this.processor.process(
            file,
            metadata,
            effectiveOptions,
            controller.signal,
            (progress) => {
              result.setProgress(
                progress * 0.9
              );

              emit(
                "media:video-processing:progress",
                {
                  id: result.id,
                  file,
                  progress:
                    result.progress,
                  status:
                    result.status,
                  result
                }
              );

              syncStore(
                `mediaLibrary.videoProcessing.active.${result.id}`,
                result.toJSON()
              );

              if (
                typeof config.onProgress ===
                "function"
              ) {
                config.onProgress({
                  id: result.id,
                  file,
                  progress:
                    result.progress,
                  result
                });
              }
            }
          );

        throwIfAborted(
          controller.signal
        );

        result.processingMethod =
          processed.method;

        result.outputMime =
          normalizeMime(
            processed.mime ||
            processed.blob.type
          );

        result.blob =
          processed.blob;

        result.outputBytes =
          processed.blob.size;

        result.metadata.processing =
          processed.metadata || {};

        result.savings =
          calculateSavings(
            file.size,
            processed.blob.size
          );

        if (
          this.shouldPreserveOriginal(
            file,
            processed.blob,
            config
          )
        ) {
          this.assignOriginalOutput(
            result,
            file,
            config
          );

          result.skip(
            "The processed video did not provide sufficient size savings."
          );

          emit(
            "media:video-processing:skipped",
            {
              file,
              result,
              reason:
                result.skipReason
            }
          );

          if (config.notifyOnSkip) {
            notify(
              "info",
              `${file.name || "The video"} was already efficiently encoded.`,
              {
                duration: 4000
              }
            );
          }

          return result;
        }

        result.setStatus(
          VIDEO_PROCESSING_STATUS.EXTRACTING_THUMBNAIL
        );

        if (
          config.generateThumbnail &&
          thumbnailApi &&
          typeof thumbnailApi.generate ===
            "function"
        ) {
          const temporaryFile =
            new File(
              [processed.blob],
              buildOutputFilename(
                file,
                result.outputMime ||
                  config.container,
                config
              ),
              {
                type:
                  result.outputMime ||
                  processed.blob.type,
                lastModified: now()
              }
            );

          result.thumbnail =
            await thumbnailApi.generate(
              temporaryFile,
              {
                ...(config.thumbnailOptions ||
                  {}),
                videoTime:
                  config.thumbnailTime,
                videoPercentage:
                  config.thumbnailPercentage,
                signal:
                  controller.signal,
                notifyOnFailure:
                  false
              }
            );
        }

        result.setStatus(
          VIDEO_PROCESSING_STATUS.FINALIZING
        );

        await this.createOutput(
          result,
          processed.blob,
          file,
          config
        );

        result.complete();

        emit(
          "media:video-processing:ready",
          {
            file,
            result
          }
        );

        return result;
      } catch (error) {
        if (
          controller.signal.aborted ||
          (
            error &&
            error.name === "AbortError"
          )
        ) {
          result.cancel();

          emit(
            "media:video-processing:cancelled",
            {
              file,
              result
            }
          );

          return result;
        }

        result.fail(error);

        emit(
          "media:video-processing:failed",
          {
            file,
            result,
            error
          }
        );

        if (config.notifyOnFailure) {
          notify(
            "error",
            `Video processing failed for ${
              file.name || "the selected video"
            }.`,
            {
              duration: 6000,
              metadata: {
                processingId:
                  result.id,
                error:
                  error &&
                  error.message
                    ? error.message
                    : String(error)
              }
            }
          );
        }

        return result;
      } finally {
        this.activeControllers.delete(
          result.id
        );

        this.activeResults.delete(
          result.id
        );

        syncStore(
          `mediaLibrary.videoProcessing.active.${result.id}`,
          null
        );

        syncStore(
          `mediaLibrary.videoProcessing.results.${result.id}`,
          result.toJSON()
        );
      }
    }

    validateMetadata(metadata, options) {
      if (
        metadata.duration <
        options.minimumDurationSeconds
      ) {
        throw new Error(
          "The video is shorter than the configured minimum duration."
        );
      }

      if (
        metadata.duration >
        options.maximumDurationSeconds
      ) {
        throw new Error(
          "The video exceeds the configured maximum duration."
        );
      }

      if (
        options.trimEndSeconds !== null &&
        options.trimEndSeconds <=
          options.trimStartSeconds
      ) {
        throw new Error(
          "The trim end time must be greater than the trim start time."
        );
      }
    }

    shouldUsePassthrough(
      file,
      metadata,
      options
    ) {
      if (
        options.mode ===
        VIDEO_PROCESSING_MODE.PASSTHROUGH
      ) {
        return true;
      }

      if (
        options.mode ===
        VIDEO_PROCESSING_MODE.ALWAYS_TRANSCODE
      ) {
        return false;
      }

      const sourceMime =
        inferVideoMime(file);

      const sameContainer =
        options.container ===
          VIDEO_CONTAINER.ORIGINAL ||
        sourceMime === options.container;

      const withinDimensions =
        metadata.width <=
          options.maxWidth &&
        metadata.height <=
          options.maxHeight;

      const noTrim =
        options.trimStartSeconds <= 0 &&
        options.trimEndSeconds === null;

      const noForcedResize =
        !options.targetWidth &&
        !options.targetHeight;

      const noMute =
        !options.mute;

      return (
        sameContainer &&
        withinDimensions &&
        noTrim &&
        noForcedResize &&
        noMute &&
        PASSTHROUGH_MIME_TYPES.has(
          sourceMime
        )
      );
    }

    shouldPreserveOriginal(
      originalFile,
      processedBlob,
      options
    ) {
      if (
        !options.preserveOriginalWhenSmaller
      ) {
        return false;
      }

      if (
        processedBlob.size >=
        originalFile.size
      ) {
        return true;
      }

      const savings =
        calculateSavings(
          originalFile.size,
          processedBlob.size
        );

      if (
        savings.savedBytes <
        options.minimumSavingsBytes
      ) {
        return true;
      }

      return (
        savings.savingsRatio <
        options.minimumSavingsRatio
      );
    }

    assignOriginalOutput(
      result,
      file,
      options
    ) {
      result.outputMime =
        inferVideoMime(file);

      result.outputBytes =
        file.size;

      result.savings =
        calculateSavings(
          file.size,
          file.size
        );

      if (
        options.output ===
        VIDEO_OUTPUT.FILE
      ) {
        result.outputFile =
          file;

        result.output =
          file;
      } else if (
        options.output ===
        VIDEO_OUTPUT.BLOB
      ) {
        result.blob =
          file;

        result.output =
          file;
      } else {
        result.output =
          file;
      }
    }

    async createOutput(
      result,
      blob,
      sourceFile,
      options
    ) {
      if (
        options.output ===
        VIDEO_OUTPUT.BLOB
      ) {
        result.output =
          blob;

        return;
      }

      if (
        options.output ===
        VIDEO_OUTPUT.FILE
      ) {
        const filename =
          buildOutputFilename(
            sourceFile,
            result.outputMime ||
              options.container,
            options
          );

        const outputFile =
          new File(
            [blob],
            filename,
            {
              type:
                result.outputMime ||
                blob.type,
              lastModified: now()
            }
          );

        result.outputFile =
          outputFile;

        result.output =
          outputFile;

        return;
      }

      if (
        options.output ===
        VIDEO_OUTPUT.OBJECT_URL
      ) {
        if (
          typeof URL === "undefined" ||
          typeof URL.createObjectURL !==
            "function"
        ) {
          throw new Error(
            "Object URL output is unavailable."
          );
        }

        result.objectUrl =
          URL.createObjectURL(blob);

        result.output =
          result.objectUrl;

        return;
      }

      if (
        options.output ===
        VIDEO_OUTPUT.ARRAY_BUFFER
      ) {
        result.arrayBuffer =
          await blob.arrayBuffer();

        result.output =
          result.arrayBuffer;

        return;
      }

      result.output =
        blob;
    }

    async processBatch(files, options) {
      const config =
        normalizeOptions({
          ...this.defaultOptions,
          ...(options || {})
        });

      const fileList =
        Array.from(files || []).filter(
          (file) =>
            isFile(file) ||
            isBlob(file)
        );

      const concurrency =
        clamp(
          config.concurrency,
          1,
          Math.max(
            1,
            fileList.length
          )
        );

      const batchId =
        createId(
          "video_processing_batch"
        );

      const results =
        new Array(
          fileList.length
        );

      let nextIndex = 0;
      let completed = 0;
      let ready = 0;
      let skipped = 0;
      let failed = 0;
      let cancelled = 0;

      emit(
        "media:video-processing:batch:start",
        {
          batchId,
          total:
            fileList.length
        }
      );

      const worker = async () => {
        while (true) {
          const index =
            nextIndex;

          nextIndex += 1;

          if (
            index >=
            fileList.length
          ) {
            return;
          }

          throwIfAborted(
            config.signal
          );

          const file =
            fileList[index];

          const result =
            await this.process(
              file,
              {
                ...config,
                notifyOnFailure:
                  false,
                notifyOnSkip:
                  false,
                onProgress:
                  (progressData) => {
                    emit(
                      "media:video-processing:batch:item-progress",
                      {
                        batchId,
                        index,
                        file,
                        ...progressData
                      }
                    );
                  }
              }
            );

          results[index] =
            result;

          completed += 1;

          if (
            result.status ===
            VIDEO_PROCESSING_STATUS.READY
          ) {
            ready += 1;
          } else if (
            result.status ===
            VIDEO_PROCESSING_STATUS.SKIPPED
          ) {
            skipped += 1;
          } else if (
            result.status ===
            VIDEO_PROCESSING_STATUS.CANCELLED
          ) {
            cancelled += 1;
          } else {
            failed += 1;
          }

          const progress =
            fileList.length
              ? completed /
                fileList.length
              : 1;

          const payload = {
            batchId,
            total:
              fileList.length,
            completed,
            ready,
            skipped,
            failed,
            cancelled,
            progress,
            index,
            file,
            result
          };

          emit(
            "media:video-processing:batch:progress",
            payload
          );

          if (
            typeof config.onBatchProgress ===
            "function"
          ) {
            await config.onBatchProgress(
              payload
            );
          }
        }
      };

      await Promise.all(
        Array.from(
          {
            length:
              concurrency
          },
          () => worker()
        )
      );

      const summary = {
        batchId,
        total:
          fileList.length,
        completed,
        ready,
        skipped,
        failed,
        cancelled,
        results,

        successfulResults:
          results.filter(
            (result) =>
              result &&
              result.status ===
                VIDEO_PROCESSING_STATUS.READY
          ),

        outputFiles:
          results
            .map((result) =>
              result
                ? result.outputFile
                : null
            )
            .filter(Boolean),

        failedResults:
          results.filter(
            (result) =>
              !result ||
              [
                VIDEO_PROCESSING_STATUS.FAILED,
                VIDEO_PROCESSING_STATUS.UNSUPPORTED
              ].includes(
                result.status
              )
          )
      };

      emit(
        "media:video-processing:batch:complete",
        summary
      );

      syncStore(
        `mediaLibrary.videoProcessing.batches.${batchId}`,
        {
          batchId,
          total:
            summary.total,
          completed:
            summary.completed,
          ready:
            summary.ready,
          skipped:
            summary.skipped,
          failed:
            summary.failed,
          cancelled:
            summary.cancelled,
          results:
            summary.results.map(
              (result) =>
                result
                  ? result.toJSON()
                  : null
            )
        }
      );

      return summary;
    }

    registerTranscoder(transcoder) {
      return this.processor.registerTranscoder(
        transcoder
      );
    }

    unregisterTranscoder(id) {
      return this.processor.unregisterTranscoder(
        id
      );
    }

    cancel(id, reason) {
      const controller =
        this.activeControllers.get(
          normalizeString(id)
        );

      if (!controller) {
        return false;
      }

      controller.abort(
        reason instanceof Error
          ? reason
          : createAbortError(
              normalizeString(reason) ||
                "Video processing cancelled."
            )
      );

      return true;
    }

    cancelAll(reason) {
      let cancelled = 0;

      for (
        const controller of
        this.activeControllers.values()
      ) {
        if (!controller.signal.aborted) {
          controller.abort(
            reason instanceof Error
              ? reason
              : createAbortError(
                  normalizeString(reason) ||
                    "All video processing tasks were cancelled."
                )
          );

          cancelled += 1;
        }
      }

      return cancelled;
    }

    getSnapshot() {
      return {
        initialized: true,
        disposed:
          this.disposed,
        activeTasks:
          this.activeControllers.size,
        capabilities:
          this.processor.capabilities.getSnapshot(),
        defaultOptions: {
          ...this.defaultOptions
        }
      };
    }

    dispose() {
      this.cancelAll(
        "Video processing engine disposed."
      );

      this.activeControllers.clear();
      this.activeResults.clear();
      this.disposed = true;

      emit(
        "media:video-processing:disposed",
        {
          engine: this
        }
      );
    }
  }

  /* =========================================================
     UPLOAD INTEGRATION
  ========================================================= */

  class VideoProcessingUploadIntegration {
    constructor(engine) {
      this.engine = engine;
      this.enabled = true;
      this.bound = false;
      this.unsubscribe = [];
      this.resultsByUploadId =
        new Map();
    }

    bind() {
      if (this.bound) {
        return this;
      }

      this.bound = true;

      const queue =
        uploads.queue ||
        uploads.uploadQueue ||
        null;

      if (
        queue &&
        typeof queue.use === "function"
      ) {
        const middleware =
          async (context, next) => {
            if (!this.enabled) {
              return next();
            }

            const file =
              context.file ||
              (
                context.item &&
                context.item.file
              );

            if (
              !isFile(file) ||
              !isSupportedVideo(file)
            ) {
              return next();
            }

            const videoOptions =
              context.videoProcessingOptions ||
              (
                context.item &&
                context.item
                  .videoProcessingOptions
              ) ||
              {};

            const shouldProcess =
              context.processVideo !==
                false &&
              videoOptions.enabled !==
                false;

            if (!shouldProcess) {
              return next();
            }

            const result =
              await this.engine.process(
                file,
                {
                  ...videoOptions,
                  signal:
                    context.signal,
                  output:
                    VIDEO_OUTPUT.FILE,
                  notifyOnFailure:
                    false
                }
              );

            context.videoProcessing =
              result;

            if (
              result.status ===
                VIDEO_PROCESSING_STATUS.READY &&
              result.outputFile
            ) {
              context.originalFile =
                file;

              context.file =
                result.outputFile;

              if (context.item) {
                context.item.originalFile =
                  file;

                context.item.file =
                  result.outputFile;

                context.item.videoProcessing =
                  result;

                if (result.thumbnail) {
                  context.item.thumbnail =
                    result.thumbnail;
                }
              }
            } else if (context.item) {
              context.item.videoProcessing =
                result;
            }

            const uploadId =
              context.uploadId ||
              (
                context.item &&
                (
                  context.item.id ||
                  context.item.uploadId
                )
              );

            if (uploadId) {
              this.resultsByUploadId.set(
                String(uploadId),
                result
              );
            }

            return next();
          };

        const unbind =
          queue.use(
            middleware
          );

        if (
          typeof unbind ===
          "function"
        ) {
          this.unsubscribe.push(
            unbind
          );
        }
      }

      if (
        uploads.manager &&
        typeof uploads.manager
          .setVideoProcessor ===
          "function"
      ) {
        uploads.manager
          .setVideoProcessor(
            (file, options) =>
              this.engine.process(
                file,
                options
              )
          );
      }

      emit(
        "media:video-processing:integration:bound",
        {
          integration:
            "upload-system"
        }
      );

      return this;
    }

    getByUploadId(uploadId) {
      return (
        this.resultsByUploadId.get(
          String(uploadId)
        ) || null
      );
    }

    releaseByUploadId(uploadId) {
      const key =
        String(uploadId);

      const result =
        this.resultsByUploadId.get(
          key
        );

      if (!result) {
        return false;
      }

      if (
        typeof result.dispose ===
        "function"
      ) {
        result.dispose();
      }

      this.resultsByUploadId.delete(
        key
      );

      return true;
    }

    enable() {
      this.enabled = true;
      return this;
    }

    disable() {
      this.enabled = false;
      return this;
    }

    unbind() {
      while (
        this.unsubscribe.length > 0
      ) {
        const unsubscribe =
          this.unsubscribe.pop();

        try {
          unsubscribe();
        } catch (error) {
          console.error(
            "[AIFTMediaLibrary] Video processing integration cleanup failed.",
            error
          );
        }
      }

      for (
        const result of
        this.resultsByUploadId.values()
      ) {
        if (
          result &&
          typeof result.dispose ===
            "function"
        ) {
          result.dispose();
        }
      }

      this.resultsByUploadId.clear();
      this.bound = false;

      emit(
        "media:video-processing:integration:unbound",
        {
          integration:
            "upload-system"
        }
      );

      return this;
    }
  }

  /* =========================================================
     PREVIEW BINDER
  ========================================================= */

  class ProcessedVideoPreviewBinder {
    constructor(engine) {
      this.engine = engine;
      this.bindings =
        new WeakMap();
    }

    async bind(element, file, options) {
      if (
        !element ||
        typeof element !== "object"
      ) {
        throw new TypeError(
          "A valid video element is required."
        );
      }

      this.unbind(element);

      const controller =
        new AbortController();

      const result =
        await this.engine.process(
          file,
          {
            ...(options || {}),
            signal:
              controller.signal,
            output:
              VIDEO_OUTPUT.OBJECT_URL
          }
        );

      if (
        ![
          VIDEO_PROCESSING_STATUS.READY,
          VIDEO_PROCESSING_STATUS.SKIPPED
        ].includes(result.status)
      ) {
        return result;
      }

      let previewUrl =
        result.objectUrl;

      let createdFallbackUrl =
        false;

      if (!previewUrl) {
        const previewSource =
          result.outputFile ||
          result.blob ||
          file;

        previewUrl =
          URL.createObjectURL(
            previewSource
          );

        createdFallbackUrl =
          true;
      }

      element.src =
        previewUrl;

      element.controls =
        options &&
        options.controls === false
          ? false
          : true;

      element.playsInline =
        true;

      element.dataset
        .aiftVideoProcessingId =
        result.id;

      this.bindings.set(
        element,
        {
          result,
          controller,
          previewUrl,
          createdFallbackUrl
        }
      );

      return result;
    }

    unbind(element) {
      const binding =
        this.bindings.get(
          element
        );

      if (!binding) {
        return false;
      }

      binding.controller.abort(
        createAbortError(
          "Processed video preview removed."
        )
      );

      if (
        binding.createdFallbackUrl &&
        binding.previewUrl
      ) {
        URL.revokeObjectURL(
          binding.previewUrl
        );
      }

      if (
        binding.result &&
        typeof binding.result.dispose ===
          "function"
      ) {
        binding.result.dispose();
      }

      element.pause();
      element.removeAttribute(
        "src"
      );

      try {
        element.load();
      } catch (error) {
        void error;
      }

      if (element.dataset) {
        delete element.dataset
          .aiftVideoProcessingId;
      }

      this.bindings.delete(
        element
      );

      return true;
    }
  }

  /* =========================================================
     PUBLIC INITIALIZATION
  ========================================================= */

  const videoProcessingEngine =
    new VideoProcessingEngine();

  const uploadIntegration =
    new VideoProcessingUploadIntegration(
      videoProcessingEngine
    );

  const previewBinder =
    new ProcessedVideoPreviewBinder(
      videoProcessingEngine
    );

  uploadIntegration.bind();

  const videoProcessingApi = {
    constants: {
      status:
        VIDEO_PROCESSING_STATUS,
      mode:
        VIDEO_PROCESSING_MODE,
      output:
        VIDEO_OUTPUT,
      container:
        VIDEO_CONTAINER,
      videoCodec:
        VIDEO_CODEC,
      audioCodec:
        AUDIO_CODEC,
      qualityPreset:
        VIDEO_QUALITY_PRESET,
      fit:
        VIDEO_FIT,
      frameRateMode:
        VIDEO_FRAME_RATE_MODE
    },

    engine:
      videoProcessingEngine,

    processor:
      videoProcessingEngine.processor,

    uploadIntegration,
    previewBinder,

    process(file, options) {
      return videoProcessingEngine.process(
        file,
        options
      );
    },

    processBatch(files, options) {
      return videoProcessingEngine.processBatch(
        files,
        options
      );
    },

    cancel(id, reason) {
      return videoProcessingEngine.cancel(
        id,
        reason
      );
    },

    cancelAll(reason) {
      return videoProcessingEngine.cancelAll(
        reason
      );
    },

    bindPreview(element, file, options) {
      return previewBinder.bind(
        element,
        file,
        options
      );
    },

    unbindPreview(element) {
      return previewBinder.unbind(
        element
      );
    },

    registerTranscoder(transcoder) {
      return videoProcessingEngine.registerTranscoder(
        transcoder
      );
    },

    unregisterTranscoder(id) {
      return videoProcessingEngine.unregisterTranscoder(
        id
      );
    },

    getPreset(preset) {
      const value =
        QUALITY_PRESETS[preset];

      return value
        ? {
            ...value
          }
        : null;
    },

    getCapabilities() {
      return videoProcessingEngine
        .processor
        .capabilities
        .getSnapshot();
    },

    getSnapshot() {
      return videoProcessingEngine.getSnapshot();
    },

    dispose() {
      uploadIntegration.unbind();
      videoProcessingEngine.dispose();
    }
  };

  uploads.videoProcessing =
    videoProcessingApi;

  uploads.videoProcessor =
    videoProcessingEngine;

  mediaLibrary.videoProcessing =
    videoProcessingApi;

  mediaLibrary.videoProcessor =
    videoProcessingApi;

  mediaLibrary.videoProcessingEngine =
    videoProcessingEngine;

  mediaLibrary.processMediaVideo =
    function processMediaVideo(
      file,
      options
    ) {
      return videoProcessingEngine.process(
        file,
        options
      );
    };

  mediaLibrary.processMediaVideos =
    function processMediaVideos(
      files,
      options
    ) {
      return videoProcessingEngine.processBatch(
        files,
        options
      );
    };

  mediaLibrary.bindProcessedVideoPreview =
    function bindProcessedVideoPreview(
      element,
      file,
      options
    ) {
      return previewBinder.bind(
        element,
        file,
        options
      );
    };

  mediaLibrary.unbindProcessedVideoPreview =
    function unbindProcessedVideoPreview(
      element
    ) {
      return previewBinder.unbind(
        element
      );
    };

  mediaLibrary.getVideoProcessingSnapshot =
    function getVideoProcessingSnapshot() {
      return videoProcessingEngine.getSnapshot();
    };

  mediaLibrary.__videoProcessingEngineInitialized =
    true;

  emit(
    "media:video-processing:initialized",
    {
      engine:
        videoProcessingEngine,
      snapshot:
        videoProcessingEngine.getSnapshot()
    }
  );
})(window);
