import { Code, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import ActionIcon from "../action-icon";
import WorkflowEditorRightPanelBase from "../right-panel-base";
import { useWorkflowStore } from "@/stores/workflow-store";
import { useEditorActionStore } from "@/stores/editor-action-store";
import { TEditorWorkflowActionNode } from "@/types/react-flow";
import { produce } from "immer";
import { ChangeEvent } from "react";

export default function ActionEditPanel() {
	const { nodes, selectedNodeIdx, updateNodeData } = useWorkflowStore();
	const { actionsIndex } = useEditorActionStore();

	if (selectedNodeIdx === null) {
		return null;
	}

	const action = nodes[selectedNodeIdx];
	const actionData = action.data as TEditorWorkflowActionNode;
	const actionDefinition = actionsIndex[action.data.actionType];

	const onChangeResultName = (event: ChangeEvent<HTMLInputElement>) => {
		updateNodeData(
			selectedNodeIdx,
			produce(actionData, (draft) => {
				draft.resultName = event.target.value;
			}),
		);
	};

	const onChangeSecretsMapping = (
		secretPlaceholder: string,
		event: ChangeEvent<HTMLInputElement>,
	) => {
		updateNodeData(
			selectedNodeIdx,
			produce(actionData, (draft) => {
				draft.secretsMapping[secretPlaceholder] = event.target.value;
			}),
		);
	};

	const onChangeActionArgument = (
		argument: string,
		event: ChangeEvent<HTMLTextAreaElement>,
	) => {
		updateNodeData(
			selectedNodeIdx,
			produce(actionData, (draft) => {
				draft.args[argument] = event.target.value;
			}),
		);
	};

	return (
		<WorkflowEditorRightPanelBase
			title={actionDefinition.displayName}
			titleIcon={<ActionIcon actionType={action.data.actionType} />}
		>
			<Flex direction="column" gap="4" p="4">
				<Flex direction="column" gap="2">
					<Text>Action Type</Text>
					<TextField.Root
						variant="surface"
						value={actionDefinition.actionType}
						disabled
					/>
				</Flex>

				{actionDefinition.description && (
					<Flex direction="column" gap="2">
						<Text color="gray" weight="light" size="2">
							{actionDefinition.description}
						</Text>
					</Flex>
				)}

				<Flex direction="column" gap="2">
					<Text>Result Name</Text>
					<TextField.Root
						variant="surface"
						value={actionData.resultName || ""}
						onChange={onChangeResultName}
					/>
				</Flex>

				{actionDefinition.secretsPlaceholders.length > 0 && (
					<Flex direction="column" gap="2">
						<Text weight="medium" size="4">
							Secrets
						</Text>
						{actionDefinition.secretsPlaceholders.map(
							(secretPlaceholder) => (
								<Flex
									key={`${action.id}_secret_placeholder_${secretPlaceholder}`}
									direction="column"
									gap="1"
								>
									<Flex>
										<Code>{secretPlaceholder}</Code>
									</Flex>
									<TextField.Root
										variant="surface"
										value={
											actionData.secretsMapping[
												secretPlaceholder
											]
										}
										onChange={(event) =>
											onChangeSecretsMapping(
												secretPlaceholder,
												event,
											)
										}
									/>
								</Flex>
							),
						)}
					</Flex>
				)}

				{actionDefinition.arguments.length > 0 && (
					<Flex direction="column" gap="2">
						<Text weight="medium" size="4">
							Action Arguments
						</Text>
						{actionDefinition.arguments.map((argument) => (
							<Flex
								key={`${action.id}_action_edit_${argument.argName}`}
								direction="column"
								gap="1"
							>
								<Text>{argument.displayName}</Text>
								<Text color="gray" weight="light" size="1">
									{argument.description}
								</Text>
								<Text color="gray" weight="light" size="1">
									Type: {argument.argType}
								</Text>
								<TextArea
									variant="surface"
									value={actionData.args[argument.argName]}
									resize="vertical"
									onChange={(event) =>
										onChangeActionArgument(
											argument.argName,
											event,
										)
									}
								/>
								<Flex justify="end">
									<Text color="gray" weight="light" size="1">
										{argument.isOptional
											? "Optional"
											: "Required"}
									</Text>
								</Flex>
							</Flex>
						))}
					</Flex>
				)}
			</Flex>
		</WorkflowEditorRightPanelBase>
	);
}
