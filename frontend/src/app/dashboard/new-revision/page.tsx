"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/checkbox";
import { getAuthHeader } from "@/lib/utils";

const questionTypes = [
  { id: "multiple-choice", label: "Multiple Choice" },
  { id: "cloze", label: "Cloze (Fill in the Blank)" },
  { id: "true-false", label: "True/False" },
  { id: "matching", label: "Matching" },
];

export default function NewRevisionPage() {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(
    []
  );
  const { toast } = useToast();

  const getTotalFileSize = (fileList: File[]) => {
    return fileList.reduce((total, file) => total + file.size, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const combinedFiles = [...files, ...newFiles];
      const totalSize = getTotalFileSize(combinedFiles);

      if (totalSize > 20 * 1024 * 1024) {
        console.log("File Exceeded");
        toast({
          title: "File Size Exceeded",
          description: "Total file size must not exceed 20MB.",
          action: <button>Close</button>,
        });
        return;
      }
      setFiles(combinedFiles);
    }
  };

  const handleFileRemove = (fileToRemove: File) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  const handleQuestionTypeChange = (questionTypeId: string) => {
    setSelectedQuestionTypes((prev) =>
      prev.includes(questionTypeId)
        ? prev.filter((id) => id !== questionTypeId)
        : [...prev, questionTypeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (getTotalFileSize(files) > 20 * 1024 * 1024) {
      toast({
        title: "File Size Exceeded",
        description: "Cannot proceed, total file size exceeds 20MB.",
        action: <button>Close</button>,
      });
      return;
    }

    // Here you would typically send the data to your backend
    console.log({ title, files, notes, selectedQuestionTypes });
    toast({
      title: "Revision Created",
      description: "Your new revision has been created successfully.",
    });

    const formData = new FormData();
    formData.append("title", title);
    formData.append("notes", notes);
    formData.append("questionTypes", JSON.stringify(selectedQuestionTypes));
    files.forEach((file) => formData.append("files", file));

    const token = await getAuthHeader();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/revisions/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Revision created" });
        // Reset form...
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create revision" });
    }

    // Reset form
    setTitle("");
    setFiles([]);
    setNotes("");
    setSelectedQuestionTypes([]);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto border rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold">Create New Revision</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Revision Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">
            Upload Study Materials (PDF, Image, etc.)
          </Label>
          <Input
            id="file"
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.ppt"
          />
          <ul className="mt-2 space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-100 p-2 rounded-md border"
              >
                <span className="truncate w-3/4">{file.name}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleFileRemove(file)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Question Types</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedQuestionTypes.includes(type.id)}
                  onCheckedChange={() => handleQuestionTypeChange(type.id)}
                />
                <Label htmlFor={type.id}>{type.label}</Label>
              </div>
            ))}
          </div>
        </div>
        <Button type="submit">Create Revision</Button>
      </form>
      <ToastContainer />
    </div>
  );
}
