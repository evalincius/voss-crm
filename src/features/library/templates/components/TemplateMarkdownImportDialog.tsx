import { useMemo, useRef, useState } from "react";
import { FileUp, RefreshCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseTemplateMarkdownFiles } from "@/features/library/templates/services/templateMarkdownImportService";
import {
  useCommitTemplateMarkdownImport,
  usePreviewTemplateMarkdownImport,
  useTemplateProductOptions,
} from "@/features/library/templates/hooks/useTemplates";
import type {
  TemplateMarkdownImportCommitResult,
  TemplateMarkdownImportPreviewResult,
  TemplateMarkdownImportPreviewRow,
  TemplateMarkdownImportRowInput,
  TemplateMarkdownLocalParseError,
} from "@/features/library/templates/types";

interface TemplateMarkdownImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

type ImportStep = "upload" | "result";

interface UploadEntry {
  sourceId: string;
  rowIndex: number;
  fileName: string;
  row: TemplateMarkdownImportRowInput | null;
  messages: string[];
}

function isMarkdownFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".md");
}

function toDryRunRow(error: TemplateMarkdownLocalParseError): TemplateMarkdownImportPreviewRow {
  return {
    row_index: error.rowIndex,
    source_id: error.sourceId,
    file_name: error.fileName,
    title: "-",
    category: "-",
    status: "-",
    action: "error",
    template_id: null,
    resolved_product_ids: [],
    messages: error.messages,
  };
}

function toUploadEntry(
  row: TemplateMarkdownImportRowInput | TemplateMarkdownLocalParseError,
): UploadEntry {
  if ("title" in row) {
    return {
      sourceId: row.sourceId,
      rowIndex: row.rowIndex,
      fileName: row.fileName,
      row,
      messages: [],
    };
  }

  return {
    sourceId: row.sourceId,
    rowIndex: row.rowIndex,
    fileName: row.fileName,
    row: null,
    messages: row.messages,
  };
}

function actionColor(action: "create" | "error" | "created" | "aborted") {
  if (action === "create" || action === "created") {
    return "text-green-500";
  }

  if (action === "aborted") {
    return "text-yellow-500";
  }

  return "text-destructive";
}

export function TemplateMarkdownImportDialog({
  open,
  onOpenChange,
  organizationId,
}: TemplateMarkdownImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [dryRunResult, setDryRunResult] = useState<TemplateMarkdownImportPreviewResult | null>(
    null,
  );
  const [commitResult, setCommitResult] = useState<TemplateMarkdownImportCommitResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hasPreflightRun, setHasPreflightRun] = useState(false);
  const [isPartialConfirmOpen, setIsPartialConfirmOpen] = useState(false);

  const previewMutation = usePreviewTemplateMarkdownImport();
  const commitMutation = useCommitTemplateMarkdownImport();
  const productOptionsQuery = useTemplateProductOptions(organizationId);

  const validRows = useMemo(
    () =>
      entries
        .filter((entry) => entry.row !== null)
        .map((entry) => entry.row)
        .filter((row): row is TemplateMarkdownImportRowInput => row !== null),
    [entries],
  );

  const localErrors = useMemo(
    () =>
      entries
        .filter((entry) => entry.row === null)
        .map((entry) => ({
          sourceId: entry.sourceId,
          fileName: entry.fileName,
          rowIndex: entry.rowIndex,
          messages: entry.messages,
        })),
    [entries],
  );

  const combinedDryRunRows = useMemo(() => {
    if (!hasPreflightRun) {
      return [];
    }

    const local = localErrors.map(toDryRunRow);
    const server = dryRunResult?.rows ?? [];
    return [...local, ...server].sort((a, b) => a.row_index - b.row_index);
  }, [dryRunResult?.rows, hasPreflightRun, localErrors]);

  const preflightErrorCount = (dryRunResult?.errors ?? 0) + localErrors.length;
  const preflightValidCount = dryRunResult?.valid_rows ?? 0;
  const hasActionableRows = preflightValidCount > 0;
  const resultFailedCount = commitResult?.rows.filter((row) => row.action === "error").length ?? 0;
  const selectedProduct = (productOptionsQuery.data ?? []).find(
    (product) => product.id === selectedProductId,
  );
  const selectedProductDisplay = selectedProduct?.name ?? selectedProductId;

  const liveMessage = useMemo(() => {
    if (isParsing) {
      return "Parsing markdown files.";
    }

    if (previewMutation.isPending) {
      return "Running import preflight.";
    }

    if (commitMutation.isPending) {
      return "Creating templates.";
    }

    if (isPartialConfirmOpen) {
      return "Preflight found errors. Confirm partial create.";
    }

    if (step === "upload") {
      return "Upload markdown files and create templates.";
    }

    return "Import result ready.";
  }, [commitMutation.isPending, isParsing, isPartialConfirmOpen, previewMutation.isPending, step]);

  function resetState() {
    setStep("upload");
    setEntries([]);
    setSelectedProductId("");
    setDryRunResult(null);
    setCommitResult(null);
    setServerError(null);
    setHasPreflightRun(false);
    setIsPartialConfirmOpen(false);
  }

  function closeDialog() {
    onOpenChange(false);
    resetState();
  }

  async function addFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setServerError(null);
    const markdownFiles = files.filter(isMarkdownFile);

    if (markdownFiles.length === 0) {
      toast.error("Only .md files are supported.");
      return;
    }

    const nextRowIndex = entries.reduce((max, entry) => Math.max(max, entry.rowIndex), 0) + 1;

    setIsParsing(true);
    try {
      const parsed = await parseTemplateMarkdownFiles(markdownFiles, nextRowIndex);
      const nextEntries = [
        ...parsed.rows.map((row) => toUploadEntry(row)),
        ...parsed.errors.map((error) => toUploadEntry(error)),
      ];

      setEntries((current) => [...current, ...nextEntries]);
      setStep("upload");
      setDryRunResult(null);
      setCommitResult(null);
      setHasPreflightRun(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to parse markdown files.");
    } finally {
      setIsParsing(false);
    }
  }

  async function runCommit() {
    if (validRows.length === 0 || selectedProductId.length === 0) {
      return;
    }

    setServerError(null);
    setIsPartialConfirmOpen(false);

    try {
      const response = await commitMutation.mutateAsync({
        organizationId,
        productId: selectedProductId,
        rows: validRows,
        commitMode: "partial",
      });

      setCommitResult(response.result);
      setStep("result");

      if (response.result.applied) {
        toast.success(`Import complete: ${response.result.created} created.`);
      } else {
        toast.warning("Import was not applied. Resolve errors and try again.");
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Create failed.");
    }
  }

  async function createTemplates() {
    if (validRows.length === 0 || selectedProductId.length === 0) {
      return;
    }

    setServerError(null);
    try {
      const result = await previewMutation.mutateAsync({
        organizationId,
        productId: selectedProductId,
        rows: validRows,
      });

      setDryRunResult(result);
      setCommitResult(null);
      setHasPreflightRun(true);

      const totalErrors = result.errors + localErrors.length;
      if (result.valid_rows === 0) {
        toast.warning("No valid templates to create. Resolve errors and try again.");
        return;
      }

      if (totalErrors === 0) {
        await runCommit();
        return;
      }

      setIsPartialConfirmOpen(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Preflight failed.");
    }
  }

  function removeEntry(sourceId: string) {
    setEntries((current) => current.filter((entry) => entry.sourceId !== sourceId));
    setDryRunResult(null);
    setCommitResult(null);
    setStep("upload");
    setHasPreflightRun(false);
  }

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    setDryRunResult(null);
    setCommitResult(null);
    setHasPreflightRun(false);
    setServerError(null);
  }

  function retryFailedOnly() {
    if (!commitResult) {
      return;
    }

    const failedSourceIds = new Set(
      commitResult.rows
        .filter((row) => row.action === "error" && typeof row.source_id === "string")
        .map((row) => row.source_id as string),
    );

    if (failedSourceIds.size === 0) {
      return;
    }

    setEntries((current) => current.filter((entry) => failedSourceIds.has(entry.sourceId)));
    setDryRunResult(null);
    setCommitResult(null);
    setStep("upload");
    setServerError(null);
    setHasPreflightRun(false);
    setIsPartialConfirmOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true);
        } else {
          closeDialog();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import templates from Markdown</DialogTitle>
          <DialogDescription>
            Upload .md files with YAML front matter. We run server preflight before creating
            templates.
          </DialogDescription>
        </DialogHeader>

        <div aria-live="polite" className="sr-only">
          {liveMessage}
        </div>

        <div className="space-y-4">
          <div className="card-surface bg-bg-surface flex flex-wrap items-center justify-between gap-2 p-3">
            <p className="text-text-secondary text-base">
              Step: <span className="text-text-primary font-semibold uppercase">{step}</span>
            </p>
            <p className="text-text-secondary text-base">
              Files: <span className="text-text-primary font-semibold">{entries.length}</span> ·
              Valid: <span className="text-text-primary font-semibold">{validRows.length}</span> ·
              Parse errors:{" "}
              <span className="text-text-primary font-semibold">{localErrors.length}</span>
            </p>
          </div>

          {step === "upload" ? (
            <div className="space-y-4">
              <div
                className="card-surface bg-bg-surface border-border-fintech rounded-md border border-dashed p-6"
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void addFiles(Array.from(event.dataTransfer.files ?? []));
                }}
              >
                <div className="flex flex-col items-start gap-2">
                  <Label htmlFor="template-md-upload">Markdown files</Label>
                  <p className="text-text-secondary text-base">
                    Drop one or many <code>.md</code> files here, or choose files manually.
                  </p>
                  <p className="text-text-secondary text-base">
                    Product links are selected in this dialog, not in markdown metadata.
                  </p>
                  <input
                    ref={fileInputRef}
                    id="template-md-upload"
                    type="file"
                    accept=".md,text/markdown"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      void addFiles(files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                  >
                    <Upload className="h-4 w-4" />
                    {isParsing ? "Parsing files..." : "Select Markdown files"}
                  </Button>
                  <details className="mt-2 w-full">
                    <summary className="text-text-secondary cursor-pointer text-base select-none">
                      Sample front matter
                    </summary>
                    <pre className="bg-bg-app border-border-fintech mt-2 overflow-x-auto rounded-md border p-3 text-sm">
                      {`---
title: "Reactivation email - Q1"
category: "warm_outreach"
status: "approved"
---
Hi {{first_name}},

We noticed you paused...`}
                    </pre>
                  </details>
                </div>
              </div>

              <div className="card-surface bg-bg-surface space-y-2 p-4">
                <Label htmlFor="template-import-product">Product *</Label>
                <Select value={selectedProductId} onValueChange={handleProductChange}>
                  <SelectTrigger id="template-import-product" className="h-10 text-base">
                    <SelectValue placeholder="Select product for this import" />
                  </SelectTrigger>
                  <SelectContent>
                    {(productOptionsQuery.data ?? []).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {productOptionsQuery.isLoading ? (
                  <p className="text-text-secondary text-base">Loading products...</p>
                ) : null}
                {productOptionsQuery.isError ? (
                  <p className="text-destructive text-base">Failed to load active products.</p>
                ) : null}
                {!productOptionsQuery.isLoading && (productOptionsQuery.data?.length ?? 0) === 0 ? (
                  <p className="text-text-secondary text-base">
                    No active products available. Create a product before importing templates.
                  </p>
                ) : null}
              </div>

              {entries.length > 0 ? (
                <div className="card-surface bg-bg-surface p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.sourceId}>
                          <TableCell>{entry.fileName}</TableCell>
                          <TableCell>
                            <span
                              className={
                                entry.row ? "text-sm text-green-500" : "text-destructive text-sm"
                              }
                            >
                              {entry.row ? "ready" : "error"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.messages.length > 0 ? entry.messages.join(" | ") : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-text-secondary hover:text-text-primary"
                              onClick={() => removeEntry(entry.sourceId)}
                              aria-label={`Remove ${entry.fileName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove file
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {hasPreflightRun ? (
                <div className="space-y-4">
                  <div className="card-surface bg-bg-surface p-4">
                    <p className="text-text-secondary text-base">
                      Create:{" "}
                      <span className="text-text-primary">{dryRunResult?.create_count ?? 0}</span> ·
                      Errors: <span className="text-text-primary">{preflightErrorCount}</span>
                    </p>
                  </div>

                  <div className="card-surface bg-bg-surface p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Linked products</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Messages</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedDryRunRows.map((row) => (
                          <TableRow key={`${row.source_id ?? "row"}-${row.row_index}`}>
                            <TableCell>{row.file_name}</TableCell>
                            <TableCell>{row.title}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell>{row.status}</TableCell>
                            <TableCell className="text-sm">
                              {row.action === "create"
                                ? selectedProductDisplay || "-"
                                : row.resolved_product_ids.length > 0
                                  ? row.resolved_product_ids.join(", ")
                                  : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-semibold ${actionColor(row.action)}`}
                            >
                              {row.action}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.messages.length > 0 ? row.messages.join(" | ") : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Close
                </Button>
                <Button
                  type="button"
                  className="text-black"
                  disabled={
                    validRows.length === 0 ||
                    selectedProductId.length === 0 ||
                    previewMutation.isPending ||
                    commitMutation.isPending
                  }
                  onClick={() => void createTemplates()}
                >
                  <FileUp className="h-4 w-4" />
                  {previewMutation.isPending
                    ? "Running preflight..."
                    : commitMutation.isPending
                      ? "Creating templates..."
                      : "Create templates"}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "result" && commitResult ? (
            <div className="space-y-4">
              <div className="card-surface bg-bg-surface p-4">
                <p className="text-text-secondary text-base">
                  Mode: <span className="text-text-primary">Partial create</span> · Product:{" "}
                  <span className="text-text-primary">{selectedProductDisplay || "-"}</span> ·
                  Created: <span className="text-text-primary">{commitResult.created}</span> ·
                  Failed: <span className="text-text-primary">{commitResult.failed}</span> ·
                  Aborted: <span className="text-text-primary">{commitResult.aborted}</span>
                </p>
              </div>

              <div className="card-surface bg-bg-surface p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Preflight action</TableHead>
                      <TableHead>Final action</TableHead>
                      <TableHead>Messages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commitResult.rows.map((row) => (
                      <TableRow key={`${row.source_id ?? "row"}-${row.row_index}`}>
                        <TableCell>{row.file_name}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell className="text-sm">{row.dry_run_action}</TableCell>
                        <TableCell className={`text-sm font-semibold ${actionColor(row.action)}`}>
                          {row.action}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.messages.length > 0 ? row.messages.join(" | ") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={resultFailedCount === 0}
                  onClick={retryFailedOnly}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Retry failed only
                </Button>
              </div>
            </div>
          ) : null}

          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}
        </div>
      </DialogContent>

      <AlertDialog open={isPartialConfirmOpen} onOpenChange={setIsPartialConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create valid templates only?</AlertDialogTitle>
            <AlertDialogDescription>
              {preflightValidCount} valid and {preflightErrorCount} with errors were found during
              preflight. Create the valid templates now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={commitMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-black"
              disabled={!hasActionableRows || commitMutation.isPending}
              onClick={() => {
                void runCommit();
              }}
            >
              Create valid only
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
