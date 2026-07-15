import React, { useState } from "react";
import { useAppTheme } from "../context/ThemeContext";
import { 
  Link, 
  Download, 
  Clock, 
  Eye, 
  User, 
  Settings2, 
  Clipboard,
  Sparkles,
  FileVideo,
  File,
  List,
  X,
  PackageOpen,
  Plus
} from "lucide-react";

// Guess a human-friendly file type label from a URL or extension
function guessFileType(url: string, ext?: string): { label: string; isMedia: boolean } {
  const target = (ext || url.split("?")[0].split(".").pop() || "").toLowerCase();
  const videoExts = ["mp4", "mkv", "avi", "mov", "webm", "flv", "m4v", "ts"];
  const audioExts = ["mp3", "flac", "ogg", "wav", "aac", "m4a", "opus"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
  const docExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"];
  const apkLike = ["apk", "apks", "xapk"];
  const isoLike = ["iso", "img", "dmg"];

  if (videoExts.includes(target)) return { label: "Video File", isMedia: true };
  if (audioExts.includes(target)) return { label: "Audio File", isMedia: true };
  if (archiveExts.includes(target)) return { label: "Archive File", isMedia: false };
  if (imageExts.includes(target)) return { label: "Image File", isMedia: false };
  if (docExts.includes(target)) return { label: "Document", isMedia: false };
  if (apkLike.includes(target)) return { label: "Android App (APK)", isMedia: false };
  if (isoLike.includes(target)) return { label: "Disk Image", isMedia: false };
  return { label: "File", isMedia: false };
}

// Check if a URL is a direct file link rather than a webpage
function isDirectFileLink(url: string): boolean {
  const stripped = url.split("?")[0].toLowerCase();
  const directExts = [
    "mp4","mkv","avi","mov","webm","flv","m4v","ts",
    "mp3","flac","ogg","wav","aac","m4a","opus",
    "zip","rar","7z","tar","gz","bz2","xz",
    "jpg","jpeg","png","gif","webp","bmp",
    "pdf","doc","docx","xls","xlsx",
    "apk","apks","xapk","iso","img","dmg","exe","msi","deb","rpm"
  ];
  return directExts.some((ext) => stripped.endsWith("." + ext));
}

const Downloader: React.FC = () => {
  const { 
    fetchVideoMetadata, 
    startDownload, 
    lastClipboardUrl, 
    setLastClipboardUrl,
    addToast
  } = useAppTheme();

  const [url, setUrl] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [batchLinks, setBatchLinks] = useState<string>("");
  const [directFileInfo, setDirectFileInfo] = useState<{ url: string; fileName: string; fileType: string } | null>(null);

  // Download Config state
  const [format, setFormat] = useState<"MP4" | "MP3" | "Other">("MP4");
  const [quality, setQuality] = useState<string>("Highest");
  const [subtitles, setSubtitles] = useState<boolean>(false);
  const [thumbnail, setThumbnail] = useState<boolean>(false);
  const [embedMetadata, setEmbedMetadata] = useState<boolean>(false);

  // Auto populate clipboard URLs
  const handlePasteClipboard = () => {
    if (batchMode) {
      setBatchLinks((prev) => (prev ? prev + "\n" + lastClipboardUrl : lastClipboardUrl));
    } else {
      setUrl(lastClipboardUrl);
    }
    setLastClipboardUrl("");
    addToast("Pasted link from clipboard", "info");
  };

  const handleFetch = async (targetUrl = url) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      addToast("Please enter a valid video URL.", "warning");
      return;
    }

    // Check if it is a direct file link first
    if (isDirectFileLink(trimmed)) {
      const rawName = decodeURIComponent(trimmed.split("?")[0].split("/").pop() || "file");
      const ext = rawName.split(".").pop() || "";
      const { label } = guessFileType(trimmed, ext);
      setDirectFileInfo({ url: trimmed, fileName: rawName, fileType: label });
      setMetadata(null);
      return;
    }

    setIsFetching(true);
    setMetadata(null);
    setDirectFileInfo(null);
    try {
      const data = await fetchVideoMetadata(trimmed);
      setMetadata(data);
    } catch (err) {
      // toast shown inside Context
    } finally {
      setIsFetching(false);
    }
  };

  // Drag & drop logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedText = e.dataTransfer.getData("text");
    if (droppedText && droppedText.startsWith("http")) {
      if (batchMode) {
        setBatchLinks((prev) => (prev ? prev + "\n" + droppedText : droppedText));
        addToast("URL added to batch list!", "success");
      } else {
        setUrl(droppedText);
        addToast("URL Dropped!", "success");
        handleFetch(droppedText);
      }
    }
  };

  const handleDownload = () => {
    if (!url.trim() && !directFileInfo) return;
    const targetUrl = directFileInfo ? directFileInfo.url : url;
    const opts: any = {
      format,
      quality: format === "MP4" ? quality : undefined,
      subtitles,
      thumbnail,
      embedMetadata,
    };
    if (metadata) {
      opts.title = metadata.title;
      opts.metaThumbnail = metadata.thumbnail;
    } else if (directFileInfo) {
      opts.title = directFileInfo.fileName;
      opts.format = "Other";
    }
    startDownload(targetUrl, opts);
    setMetadata(null);
    setDirectFileInfo(null);
    setUrl("");
  };

  const handleBatchDownload = () => {
    const links = batchLinks
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("http"));

    if (links.length === 0) {
      addToast("No valid URLs found in the list.", "warning");
      return;
    }

    links.forEach((link) => {
      const opts: any = {
        format,
        quality: format === "MP4" ? quality : undefined,
        subtitles,
        thumbnail,
        embedMetadata,
      };
      if (isDirectFileLink(link)) {
        const rawName = decodeURIComponent(link.split("?")[0].split("/").pop() || "file");
        opts.title = rawName;
        opts.format = "Other";
      }
      startDownload(link, opts, true); // isBatch=true suppresses per-item toast spam
    });

    addToast(links.length + " download(s) added to queue.", "success");
    setBatchLinks("");
    setBatchMode(false);
  };

  const formatDuration = (sec: number) => {
    if (!sec) return "00:00";
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    if (hrs > 0) {
      return hrs + ":" + mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");
    }
    return mins + ":" + secs.toString().padStart(2, "0");
  };

  const formatViews = (views: number) => {
    if (!views) return "0";
    if (views >= 1000000) return (views / 1000000).toFixed(1) + "M views";
    if (views >= 1000) return (views / 1000).toFixed(1) + "K views";
    return views + " views";
  };

  const selectStyle = {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "1px solid var(--card-border)",
    borderRadius: "8px",
    color: "var(--text-primary)",
    padding: "10px 14px",
    fontFamily: "inherit",
    fontSize: "14px"
  };

  return (
    <div 
      style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h1 className="view-title" style={{ marginBottom: 0 }}>Redesigned Downloader</h1>
        <button
          className={batchMode ? "btn" : "btn secondary"}
          style={{ padding: "8px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
          onClick={() => { setBatchMode(!batchMode); setMetadata(null); setDirectFileInfo(null); }}
        >
          <List size={14} />
          {batchMode ? "Single Link" : "Batch Mode"}
        </button>
      </div>
      <p className="view-subtitle">Enter a video link, drag &amp; drop URLs, or parse metadata options instantly.</p>

      {/* Single URL mode */}
      {!batchMode && (
        <div className="card" style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="input-group">
            <span style={{ display: "flex", alignItems: "center", paddingLeft: "14px", color: "var(--text-secondary)" }}>
              <Link size={18} />
            </span>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Paste YouTube, Vimeo, social link, or direct file URL here..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
            />
            <button 
              className="btn" 
              onClick={() => handleFetch()}
              disabled={isFetching || !url.trim()}
            >
              {isFetching ? "Fetching..." : "Fetch Info"}
            </button>
          </div>
          {lastClipboardUrl && (
            <div 
              onClick={handlePasteClipboard}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                backgroundColor: "rgba(var(--accent-rgb), 0.08)",
                border: "1px dashed rgba(var(--accent-rgb), 0.3)",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                color: "var(--text-primary)",
                transition: "background-color 0.2s",
                animation: "fadeIn 0.3s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clipboard size={14} style={{ color: "var(--accent-color)" }} />
                <span style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "420px" }}>
                  Detected copied URL: <strong>{lastClipboardUrl}</strong>
                </span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-color)" }}>
                Click to Paste
              </span>
            </div>
          )}
        </div>
      )}

      {/* Batch Mode */}
      {batchMode && (
        <div className="card" style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <List size={14} /> Batch Link List — one URL per line
            </span>
            {lastClipboardUrl && (
              <button
                className="btn secondary"
                style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                onClick={handlePasteClipboard}
              >
                <Plus size={12} /> Add Clipboard URL
              </button>
            )}
          </div>
          <textarea
            className="input-field"
            placeholder={"https://youtube.com/watch?v=...\nhttps://vimeo.com/...\nhttps://example.com/file.zip\n..."}
            value={batchLinks}
            onChange={(e) => setBatchLinks(e.target.value)}
            rows={6}
            style={{
              resize: "vertical",
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: "1.6",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              backgroundColor: "rgba(0,0,0,0.15)",
              color: "var(--text-primary)",
              width: "100%",
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Output Format</label>
              <select style={selectStyle} value={format} onChange={(e) => setFormat(e.target.value as any)}>
                <option value="MP4">MP4 Video</option>
                <option value="MP3">MP3 Audio</option>
                <option value="Other">Default Stream</option>
              </select>
            </div>
            {format === "MP4" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Target Quality</label>
                <select style={selectStyle} value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="Highest">Highest Quality</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                  <option value="360p">360p Mobile</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn" style={{ flex: 1 }} onClick={handleBatchDownload}>
              <Download size={16} />
              Queue All Links ({batchLinks.split("\n").filter((l) => l.trim().startsWith("http")).length})
            </button>
            <button className="btn secondary" onClick={() => setBatchLinks("")}>
              <X size={14} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Skeleton Fetch Loader */}
      {isFetching && (
        <div className="card" style={{ display: "flex", gap: "24px", flex: 1 }}>
          <div className="skeleton" style={{ width: "280px", height: "180px", borderRadius: "12px" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="skeleton" style={{ width: "80%", height: "24px" }} />
            <div className="skeleton" style={{ width: "40%", height: "16px" }} />
            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <div className="skeleton" style={{ width: "100px", height: "36px", borderRadius: "8px" }} />
              <div className="skeleton" style={{ width: "120px", height: "36px", borderRadius: "8px" }} />
            </div>
          </div>
        </div>
      )}

      {/* Direct File Link Preview */}
      {directFileInfo && !batchMode && (
        <div className="card" style={{ display: "flex", gap: "28px", flex: 1, animation: "fadeIn 0.3s ease" }}>
          <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "14px", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: "96px",
              height: "96px",
              borderRadius: "20px",
              backgroundColor: "rgba(var(--accent-rgb), 0.1)",
              border: "1px solid rgba(var(--accent-rgb), 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-color)",
            }}>
              <PackageOpen size={48} />
            </div>
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "20px",
              backgroundColor: "rgba(var(--accent-rgb), 0.1)",
              color: "var(--accent-color)",
              border: "1px solid rgba(var(--accent-rgb), 0.2)",
            }}>
              {directFileInfo.fileType}
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", lineHeight: 1.3, wordBreak: "break-all" }}>
                {directFileInfo.fileName}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px", wordBreak: "break-all" }}>
                {directFileInfo.url}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <File size={14} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
                This is a direct file link. It will be downloaded as-is without media processing.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Settings2 size={12} /> Advanced Settings
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", paddingLeft: "2px", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={thumbnail} onChange={(e) => setThumbnail(e.target.checked)} style={{ accentColor: "var(--accent-color)" }} />
                    Download cover art (thumbnail)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={embedMetadata} onChange={(e) => setEmbedMetadata(e.target.checked)} style={{ accentColor: "var(--accent-color)" }} />
                    Embed metadata tags
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn" style={{ flex: 1 }} onClick={handleDownload}>
                <Download size={16} />
                Download File
              </button>
              <button className="btn secondary" onClick={() => { setDirectFileInfo(null); setUrl(""); }}>
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Detail Preview Container */}
      {metadata && !batchMode && (
        <div className="card" style={{ display: "flex", gap: "28px", flex: 1, animation: "fadeIn 0.3s ease" }}>
          <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--shadow-md)", border: "1px solid var(--card-border)" }}>
              {metadata.thumbnail ? (
                <img 
                  src={metadata.thumbnail} 
                  alt="Thumbnail" 
                  style={{ width: "100%", height: "auto", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "rgba(255, 255, 255, 0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileVideo size={48} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                color: "white",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <Clock size={11} />
                {formatDuration(metadata.duration)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text-secondary)", padding: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={14} style={{ color: "var(--accent-color)" }} />
                <span>{metadata.uploader}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Eye size={14} style={{ color: "var(--accent-color)" }} />
                <span>{formatViews(metadata.viewCount)}</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px", lineHeight: 1.3 }}>{metadata.title}</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Output Format</label>
                  <select style={selectStyle} value={format} onChange={(e) => setFormat(e.target.value as any)}>
                    <option value="MP4">MP4 Video</option>
                    <option value="MP3">MP3 Audio</option>
                    <option value="Other">Default Stream</option>
                  </select>
                </div>
                {format === "MP4" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Target Quality</label>
                    <select style={selectStyle} value={quality} onChange={(e) => setQuality(e.target.value)}>
                      <option value="Highest">Highest Quality</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p SD</option>
                      <option value="360p">360p Mobile</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Settings2 size={12} /> Advanced Settings
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", paddingLeft: "2px", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={subtitles} onChange={(e) => setSubtitles(e.target.checked)} style={{ accentColor: "var(--accent-color)" }} />
                    Download subtitles
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={thumbnail} onChange={(e) => setThumbnail(e.target.checked)} style={{ accentColor: "var(--accent-color)" }} />
                    Download cover art (thumbnail)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={embedMetadata} onChange={(e) => setEmbedMetadata(e.target.checked)} style={{ accentColor: "var(--accent-color)" }} />
                    Embed metadata tags
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn" style={{ flex: 1 }} onClick={handleDownload}>
                <Download size={16} />
                Download Content
              </button>
              <button className="btn secondary" onClick={() => setMetadata(null)}>
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!metadata && !directFileInfo && !isFetching && !batchMode && (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed var(--card-border)",
          borderRadius: "16px",
          padding: "48px",
          opacity: 0.85,
          backgroundColor: "rgba(255, 255, 255, 0.01)",
          transition: "all 0.3s ease",
          transform: isDragging ? "scale(1.02)" : "none",
          borderColor: isDragging ? "var(--accent-color)" : "var(--card-border)"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            backgroundColor: "rgba(var(--accent-rgb), 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            color: "var(--accent-color)",
            boxShadow: "0 8px 24px rgba(var(--accent-rgb), 0.15)"
          }}>
            <Sparkles size={28} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
            {isDragging ? "Drop URL to Import!" : "No Media Selected"}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", maxWidth: "360px", lineHeight: 1.4 }}>
            {isDragging 
              ? "Release your mouse to fetch information instantly." 
              : "Enter a link above, drop a URL directly into this window, or copy a URL to system clipboard to start. Use Batch Mode to queue multiple links at once."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Downloader;
